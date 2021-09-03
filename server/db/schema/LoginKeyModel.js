const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const db = require('../index');

const loginKeySchema = new Schema({
    create_at: Date, // 创建时间，用于过期删除
    _3rd_session: String, // 登录凭证，传递给小程序客户端保存
    session_key: String, // wx-server回传给dev-server的密钥
    openid: String, // 与session_key一起从wx-server回传到dev-server的值
});

const loginKeyModel = db.model('login_key', loginKeySchema);

module.exports = loginKeyModel;