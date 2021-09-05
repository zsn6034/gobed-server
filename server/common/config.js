
const commander = require('./commander'); // 命令行工具
const fs = require('fs');
const ini = require('ini');
const path = require('path');

const mode = commander.build;

// 获取版本文件夹
const versions = path.join(__dirname, '../config/version');

// 获取文件夹下所有文件
let filesArr = fs.readdirSync(versions);
filesArr = filesArr.filter(item => {
    return item.substr(item.length - 3, 3) === 'ini';
});

// 所有版本内容集合
let versionList = filesArr.map(item => {
    return ini.parse(fs.readFileSync(versions + '/' + item, 'utf-8'));
});

// common版本
let currentVersionData = versionList.map(item => {
    if (item.version === 'common') {
        return item;
    }
});

const config = {
    // 开发模式
    dev: {
        name: currentVersionData[0].dev.name,
        httpPort: currentVersionData[0].dev.http_port,
        httpsPort: currentVersionData[0].dev.https_port,
        mongo: {
            host: currentVersionData[0].dev.db_host,
            port: currentVersionData[0].dev.db_port,
            db: currentVersionData[0].dev.db_name,
            user: currentVersionData[0].dev.db_user,
            password: currentVersionData[0].dev.db_password,
        }
    },
    // 生产模式
    prod: {
        name: currentVersionData[0].prod.name,
        httpPort: currentVersionData[0].prod.http_port,
        httpsPort: currentVersionData[0].prod.https_port,
        mongo: {
            host: currentVersionData[0].prod.db_host,
            port: currentVersionData[0].prod.db_port,
            db: currentVersionData[0].prod.db_name,
            user: currentVersionData[0].prod.db_user,
            password: currentVersionData[0].prod.db_password,
        }
    },
}

// module.exports = config.dev;
const commonConfig = {
    type: mode,
    port: commander.port || 9999,
};

module.exports = Object.assign({}, commonConfig, config[mode]);