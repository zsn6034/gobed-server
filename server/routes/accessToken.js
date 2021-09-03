const router = require('koa-router')();
const accessTokenController = require('../controllers/accessToken');

router.post('/', accessTokenController.post);

module.exports = router;