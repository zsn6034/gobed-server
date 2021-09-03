const axios = require('axios');
const UUID = require('uuid');
const status = require('../common/status');

exports.post = async (ctx) => {
    const body = ctx.request.body;
    const grant_type = body.grant_type;
    const APPID = body.appid;
    const SECRET = body.secret;
    console.log(grant_type)
    console.log(APPID)
    console.log(SECRET)
    // GET请求
    axios.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=${grant_type}&appid=${APPID}&secret=${SECRET}`)
    .then(response => {
        console.log(response.data)
        return status.success(ctx, {
            access_token: response.data.access_token
        });
    })
}