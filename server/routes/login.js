const router = require('koa-router')();
const loginController = require('../controllers/login');

router.post('/', loginController.post);

module.exports = router;