const mongoose = require('mongoose');
const config = require('../config');

let dbAddress = `mongodb://${config.mongo.host}:${config.mongo.port}/${config.mongo.db}`;
if ('user' in config.mongo) {
    console.log("----------------user------------------------------- ")
    dbAddress = `mongodb://${config.mongo.user}:${config.mongo.password}@${config.mongo.host}:${config.mongo.port}/${config.mongo.db}`;
}

console.log('dbAddress====', dbAddress);
const db = mongoose.createConnection(dbAddress, {
    authSource: 'admin',
    user: config.mongo.user,
    pass: config.mongo.password,
    // autoReconnect: true,
    // reconnectTries: Number.MAX_VALUE,
    // reconnectInterval: 500,
    poolSize: 10,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false, // https://mongoosejs.com/docs/deprecations.html#findandmodify
});

db.on('connect', err => {
    if (err) {
        console.log('连接数据库失败：' + err);
    } else {
        console.log('连接数据库成功！');
    }
});

module.exports = db;