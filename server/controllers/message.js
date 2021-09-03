const crypto = require('crypto');
const request = require('request-promise');
// const status = require('../common/status');
const { decrypt } = require('../utils/decrypt'); // 微信消息解密
const WX = require('../services/wx');
const loginService = require('../services/login');
const config = require('../config/wx_config');
const { token, appID, appScrect, encodingAESKey } = config;
const miniapp = new WX({
    token,
    appID,
    appScrect
})

// 消息推送配置验证
exports.get = async (ctx) => {
    console.log('请求到了....')
    const query = ctx.request.query;
    console.log(query);
    console.log("token="+token);
    // 1. 获取微信服务器Get请求的参数signature，timestamp，nonce，echostr
    const {
        signature,
        timestamp,
        nonce,
        echostr
    } = query;

    // 2.将token、timestamp、nonce三个参数进行字典排序
    let array = [token, timestamp, nonce].sort();

    // 3.将三个参数字符串拼接城一个字符串并进行sha1加密
    const tmpStr = array.join('');
    const hashCode = crypto.createHash('sha1'); // 创建加密类型
    const resultCode = hashCode.update(tmpStr, 'utf-8').digest('hex');

    // 4.将开发者获得的加密后字符串与signature对比，标识该请求来源于微信
    if (resultCode === signature) {
        console.log("success!");
        ctx.body = echostr;
    } else {
        console.log("error!");
        return status.error(ctx, '验证失败!');
    }
}

// 接收并处理用户消息
exports.post = async (ctx) => {
    // 加密方式
    const { ToUserName, Encrypt } = ctx.request.body;

    let decodeObj = decrypt({
        AESKey: encodingAESKey,
        text: Encrypt,
        corpid: appID
    })
    console.log("解密后的消息：")
    console.log(decodeObj)
    const decryptMsg = JSON.parse(decodeObj.msg);
    console.log("解密后的消息内容：")
    console.log(decryptMsg)

    const { MsgType, FromUserName } = decryptMsg;
    if (MsgType === 'text') { // 文本消息
        console.log("用户发送text！！！")
        miniapp.sendTextMessage(FromUserName, '您发送的是text');
    } else if (MsgType === 'image') {
        console.log("用户发送image！！！")
        miniapp.sendTextMessage(FromUserName, '您发送的是image');
    }
    ctx.body = 'success';
}

exports.sendSubscribeMessage = async ctx => {
    const body = ctx.request.body;
    const { _3rd_session, template_id, page } = body;
    const data =  {
        thing1: {
            value: '我的第一条留言：帅气'
        },
        time2: {
            value: '2020-07-08 15:50:45'
        }
    }
    console.log("data=======")
    console.log(data)
    // 通过_3rd_session获取数据库中的openid
    const arr = await loginService.getData(_3rd_session);
    const openid = arr[0]['openid'];
    // 获取access_token
    const access_token = await miniapp.getAccessToken();
    // 发送POST请求
    const options = {
        uri: `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${access_token}`,
        method: 'POST',
        json: true,
        body: {
            touser: openid,
            template_id,
            page,
            data
        },
    }
    console.log("options====")
    console.log(options)
    request(options)
    .then(res => {
        console.log("res=====")
        console.log(res)
        status.success(ctx, {msg: 'success'})
    }).catch(err => {
        console.log("err")
        console.error(err)
        status.error(ctx, '发送失败!');
    })
}

