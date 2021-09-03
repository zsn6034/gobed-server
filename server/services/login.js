const LoginKeyModel = require('../db/schema/LoginKeyModel');
const loginKeyModel = require('../db/schema/LoginKeyModel');

exports.saveKey = async (_3rd_session, session_key, openid) => {
    try {
        return await LoginKeyModel.create({
            create_at: new Date().getTime(),
            _3rd_session,
            session_key,
            openid
        }) 
    } catch (e) {
        console.error(e);
        throw new Error('保存登录凭证失败！');
    }
}

exports.getData = async _3rd_session => {
    return await loginKeyModel.find({
        _3rd_session
    })
}