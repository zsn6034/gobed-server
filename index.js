require('dotenv').config();
const server = require('./server')
const https = require('https');
const fs = require('fs');
const timeTask = require('./server/timeTask');

// 执行定时任务1：发送订阅消息
timeTask.scanAndSend();

// 定时任务2：定点更新，针对每个当天没有点击『确定』或『取消』的用户
timeTask.scanAndUpdate();

// const port = process.env.PORT || 80
const HTTP_PORT = 9999;
const HTTPS_PORT = 9998;
// server.listen(port, () => console.log(`API server started on ${port}`));
var options = {
    key: fs.readFileSync('./server/config/2_guxiaobai.top.key'),  //私钥文件路径
    cert: fs.readFileSync('./server/config/1_guxiaobai.top_bundle.crt')  //证书文件路径
};
https.createServer(options, server.callback()).listen(HTTPS_PORT, () => {
    console.log(`HTTPS: server running success at ${HTTPS_PORT}`);
});
server.listen(HTTP_PORT, () => console.log(`HTTP: API server started on ${HTTP_PORT}`));
