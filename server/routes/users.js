const Router = require('koa-router')
const router = new Router()
const userController = require('../controllers/users')

router.get('/', userController.hello);
router.get('/getPenalty', userController.getPenalty);
router.get('/getRecordList', userController.getRecordList);
router.post('/saveTime', userController.saveTime);
router.post('/confirmOrCancel', userController.confirmOrCancel);

module.exports = router;
