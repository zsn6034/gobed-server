const fs = require('fs');
const request = require('request-promise');
const path = require('path');

const domain = 'https://api.weixin.qq.com';
const apis = {
    token: `${domain}/cgi-bin/token`, // 获取token
    sendMessage: `${domain}/cgi-bin/message/custom/send`, // 发送消息
}
const accessTokenJSON = require('../config/access_token.json'); // 引入本地存储

class Wechat {
    constructor(config) {
        this.config = config;
        this.token = config.token;
        this.appID = config.appID;
        this.appScrect = config.appScrect;
    }

    // 获取AccessToken
    getAccessToken() {
        return new Promise((resolve, reject) => {
            const curTime = new Date().getTime();
            const url = `${apis.token}?grant_type=client_credential&appid=${this.appID}&secret=${this.appScrect}`
            // 过期判断
            if (!accessTokenJSON.access_token || accessTokenJSON.access_token === '' || accessTokenJSON.expires_time < curTime) {
                request(url).then(data => {
                    const res = JSON.parse(data);
                    console.log(res);
                    if (data.indexOf('errcode' < 0)) {
                        accessTokenJSON.access_token = res.access_token;
                        accessTokenJSON.expires_time = new Date().getTime() + (parseInt(res.expires_in) - 200) * 1000;
                        // 存储新的access_token
                        let accessTokenPath = path.resolve(__dirname, '../config/access_token.json')
                        fs.writeFile(accessTokenPath, JSON.stringify(accessTokenJSON), (err, res) => {
                            if (err) {
                                reject();
                                return;
                            }
                        })
                        resolve(accessTokenJSON.access_token);
                    } else {
                        resolve(res.accessTokenJSON);
                    }
                }).catch(err => {
                    reject(err);
                }) 
            } else { // access_token还在有效期内，直接返回
                resolve(accessTokenJSON.access_token);
            }
        })
    }

    // 发送文本消息
    async sendTextMessage(openid, message) {
        let token = '';
        try {
            token = await this.getAccessToken();
        } catch (err) {
            console.error(err);
            return;
        }
        const msgData = {
            "touser": openid,
            'msgtype': 'text',
            "text": {
                "content": message
            }
        }
        return request({
            method: 'POST',
            uri: `${apis.sendMessage}?access_token=${token}`,
            body: msgData,
            json: true
        })
    } 
}

module.exports = Wechat;