// module.exports = (router) => {
//   router.prefix('/v1')
//   router.use('/users', require('./users'))
// }

const Router = require('koa-router');

const loginRouter = require('./login');
const accessTokenRouter = require('./accessToken');
const messageRouter = require('./message');
const loadDataRouter = require('./loadData');
const userRouter = require('./users');

const indexRouter = new Router({
    prefix: '/gobed'
});

indexRouter.use(['/login'], loginRouter.routes(), loginRouter.allowedMethods()); // /gobed/login

indexRouter.use(['/getAccessToken'], accessTokenRouter.routes(), accessTokenRouter.allowedMethods()); // gobed/getAccessToken

indexRouter.use(['/message'], messageRouter.routes(), messageRouter.allowedMethods()); // /gobed/message

indexRouter.use(['/loadData'], loadDataRouter.routes(), loadDataRouter.allowedMethods()); // /gobed/loadData

indexRouter.use(['/users'], userRouter.routes(), userRouter.allowedMethods()); // /gobed/users

module.exports = (app) => {
    app.use(indexRouter.routes(), indexRouter.allowedMethods())
};

