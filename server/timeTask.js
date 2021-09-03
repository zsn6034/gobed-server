const schedule = require('node-schedule');
const UserInfoModel = require('./db/schema/UserInfoModel');
const request = require('request-promise');
// const status = require('../common/status');
// const { decrypt } = require('../utils/decrypt'); // 微信消息解密
const WX = require('./services/wx');
// const loginService = require('../services/login');
const config = require('./config/wx_config');
const { token, appID, appScrect } = config;
const miniapp = new WX({
    token,
    appID,
    appScrect
})

// 定时任务1：发送订阅消息
const scanAndSend = () => {
    console.log('启动定时任务...', new Date().toLocaleString());
    // 每分钟第30秒触发
    schedule.scheduleJob('30 * * * * *', async () => {
        console.log('now...')
        const d = new Date();
        console.log('小时:', d.getHours());
        console.log('分钟:', d.getMinutes());
        console.log('秒:', d.getSeconds());
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDay();
        const hour = d.getHours() < 10 ? `0${d.getHours()}` : d.getHours();
        const minute = d.getMinutes()  < 10 ? `0${d.getMinutes()}` : d.getMinutes();
        // 数据匹配
        const userInfo = await UserInfoModel.findOne({remind_time: `${hour}:${minute}`});
        // const userInfo = await UserInfoModel.findOne();
        console.log('userInfo====', userInfo);
        // 存在匹配数据：发送订阅消息
        if (userInfo) {
            console.log('准备发送...')
            const openid = userInfo['openid'];
            // 获取access_token
            const access_token = await miniapp.getAccessToken();
            // 发送POST请求
            const options = {
                uri: `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${access_token}`,
                method: 'POST',
                json: true,
                body: {
                    touser: openid,
                    template_id: 'O6c2pnATJplJuyvxEuwbOH-W4n8_XxBGA-oql6jgs0Q',
                    page: 'pages/confirm/index',
                    data: {
                        time1: {
                            // value: '2021年8月22日 11:30'
                            value: `${year}年${month}月${day}日 ${hour}:${minute}`,
                        },
                        thing2: {
                            value: `到时间请睡觉，不然得交${userInfo.cur_money || 20}块钱作为惩罚啦`
                            // value: `得交${punishMoney}块钱啦`
                        },
                    }
                },
            }
            // console.log("options====")
            // console.log(options)
            request(options)
            .then(res => {
                console.log("res=====")
                console.log(res)
                // status.success(ctx, {msg: 'success'})
            }).catch(err => {
                console.log("err")
                console.error(err)
                // status.error(ctx, '发送失败!');
            })
        }
    })
}

// scanAndSend();
// console.log('开始...')

exports.scanAndSend = scanAndSend;

// 获取昨天日期
const getYesterday = () => {
    const d = new Date();
    d.setTime(d.getTime() - 24 * 60 * 60 * 1000);
    const year = d.getFullYear();
    const month = d.getMonth() + 1 < 10 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
    const day = d.getDate() + 1 < 10 ? `0${d.getDate()}` : d.getDate();
    const yesterday = year + '-' + month + '-' + day;
    console.log('yesterday is: ', yesterday);
    return yesterday;
};

// 定时任务2：定点更新，针对每个当天没有点击『确定』或『取消』的用户
const scanAndUpdate = () => {
    // 每天凌晨1点触发
    schedule.scheduleJob('0 0 1 * * *', async () => {
    // schedule.scheduleJob('15 16 23 * * *', async () => {
        // 获取昨天日期
        const yesterday = getYesterday();
        // const yesterday = '2021-08-29';
        // 数据匹配
        const userInfoList = await UserInfoModel.find({last_confirm_date: yesterday});
        // console.log('userInfo=========', userInfo);
        if (userInfoList.length > 0) {
            userInfoList.forEach(async (userInfo) => {
                // 计算惩罚金额
                let updateContent = {};
                let { openid, cur_money, min_money, multiple, max_days, continue_days, last_confirm_date, last_confirm_action } = userInfo;
                // 还在当前惩罚天数范围内
                if (continue_days < max_days) {
                    updateContent = { continue_days: continue_days + 1 };
                }
                // 到达当前惩罚天数上限，需要翻倍
                else {
                    updateContent = {
                        continue_days: 1,
                        cur_money: cur_money * multiple,
                    };
                }
                // 更新数据
                await UserInfoModel.findOneAndUpdate({openid}, updateContent, {
                    new: true,
                    // upsert: true,
                });
            });
        }
    });
};

exports.scanAndUpdate = scanAndUpdate;