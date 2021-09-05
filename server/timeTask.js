const schedule = require('node-schedule');
const UserInfoModel = require('./db/schema/UserInfoModel');
const RecordModel = require('./db/schema/RecordModel');
const request = require('request-promise');
// const status = require('../common/status');
// const { decrypt } = require('../utils/decrypt'); // 微信消息解密
const WX = require('./services/wx');
// const loginService = require('../services/login');
const { getYesterday, getToday } = require('./utils/date');
const { token, appID, appScrect } = require('./config/wx_config');
const miniapp = new WX({
    token,
    appID,
    appScrect
})

// 定时任务1：发送订阅消息
const scanAndSend = () => {
    console.log('执行定时任务1...', new Date().toLocaleString());
    // 每分钟第30秒触发
    schedule.scheduleJob('30 * * * * *', async () => {
        const d = new Date();
        console.log('小时:', d.getHours());
        console.log('分钟:', d.getMinutes());
        console.log('秒:', d.getSeconds());
        const year = d.getFullYear();
        const month = d.getMonth() + 1 < 10 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
        const day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();
        const hour = d.getHours() < 10 ? `0${d.getHours()}` : d.getHours();
        const minute = d.getMinutes()  < 10 ? `0${d.getMinutes()}` : d.getMinutes();
        const remindTime = `${hour}:${minute}`;
        // 数据匹配
        const userInfoList = await UserInfoModel.find({remind_time: remindTime});
        console.log('userInfoList====', userInfoList);
        // 存在匹配数据：发送订阅消息
        if (userInfoList.length > 0) {
            console.log('准备发送...')
            // 获取access_token
            const access_token = await miniapp.getAccessToken();
            userInfoList.forEach(async (userInfo) => {
                const openid = userInfo['openid'];
                // 插入数据到record表
                const record = {
                    openid,
                    date: getToday(),
                    remind_time: remindTime,
                    cur_money: userInfo.cur_money || 20,
                    last_confirm_date: null,
                    last_confirm_action: 0, // 初始化：0代表无操作
                };
                try {
                    await RecordModel.create(record);
                    // 发送POST请求
                    const options = {
                        uri: `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${access_token}`,
                        method: 'POST',
                        json: true,
                        body: {
                            touser: openid,
                            template_id: 'O6c2pnATJplJuyvxEuwbOH-W4n8_XxBGA-oql6jgs0Q',
                            page: 'pages/records/index',
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
                } catch (error) {
                    console.error('插入数据到record表失败！', error);
                }
            });
        }
    })
}

// scanAndSend();
// console.log('开始...')

exports.scanAndSend = scanAndSend;

// 定时任务2：定点更新，针对每个当天没有点击『确定』或『取消』的用户
const scanAndUpdate = () => {
    // 每天中午12点0分30秒触发
    schedule.scheduleJob('30 0 12 * * *', async () => {
    // schedule.scheduleJob('15 28 14 * * *', async () => {
        console.log('执行定时任务2！');
        // 获取昨天日期
        const yesterday = getYesterday();
        // 数据匹配
        const noActionRecords = await RecordModel.find({date: yesterday, last_confirm_action: 0});
        if (noActionRecords.length > 0) {
            noActionRecords.forEach(async (record) => {
                // console.log('record====', record);
                const id = record._id;
                // 修改该record为惩罚
                try {
                    await RecordModel.findByIdAndUpdate(id, {last_confirm_action: 1}, {new: true});
                    const userInfo = await UserInfoModel.findOne({openid: record.openid});
                    if (userInfo) {
                        // 计算惩罚金额
                        let updateContent = {};
                        let { openid, cur_money, total_money, min_money, multiple, max_days, continue_days, last_confirm_date, last_confirm_action } = userInfo;
                        // 还在当前惩罚天数范围内
                        if (continue_days < max_days - 1) {
                            updateContent = {
                                continue_days: continue_days + 1,
                                total_money: total_money + cur_money,
                            };
                        }
                        // 到达当前惩罚天数上限，需要翻倍
                        else {
                            updateContent = {
                                continue_days: 0,
                                cur_money: cur_money * multiple,
                                total_money: total_money + cur_money,
                            };
                        }
                        // 更新数据
                        await UserInfoModel.findOneAndUpdate({openid}, updateContent, {
                            new: true,
                            // upsert: true,
                        });
                    }
                } catch (error) {
                    console.log('修改该record为惩罚失败！', error);
                }
            });
        }
    });
};

// scanAndUpdate();

exports.scanAndUpdate = scanAndUpdate;