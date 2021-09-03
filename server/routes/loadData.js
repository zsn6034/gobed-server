const router = require('koa-router')();
const loadDataController = require('../controllers/loadData');

router.get('/period', loadDataController.getPeriod);

router.get('/preparatory', loadDataController.getPreparatory);

module.exports = router;