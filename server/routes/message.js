const router = require('koa-router')();
const messageController = require('../controllers/message');

router.get('/', messageController.get); // 消息推送认证
router.post('/', messageController.post); // 消息推送

router.post('/sendSubscribeMessage', messageController.sendSubscribeMessage); // 发送订阅消息

module.exports = router;