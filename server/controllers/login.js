const axios = require('axios');
const UUID = require('uuid');
const status = require('../common/status');
const loginService = require('../services/login');
const config = require('../config/wx_config');

// 用户登录
exports.post = async (ctx) => {
    const body = ctx.request.body;
    const CODE = body.code;
    const APPID = body.appid || config.appID;
    const SECRET = body.appsecret || config.appScrect;
    // GET请求
    // APPID,SECRET,JSCODE分别替换为appid,appsecret和code的值
    // https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code
    await axios.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${CODE}&grant_type=authorization_code`)
    .then(response => {
        const session_key = response.data.session_key;
        console.log("session_key="+session_key)
        const openid = response.data.openid;
        console.log("openid="+openid)
        const _3rd_session = UUID.v1(); // 基于时间戳生成
        console.log("_3rd_session="+_3rd_session)
        // // 将_3rd_session、session_key和openid存到mongodb，并设置过期时间
        loginService.saveKey(_3rd_session, session_key, openid);
        // 返回_3rd_session作为登录凭证
        return status.success(ctx, {
            _3rd_session
        });
    })
}