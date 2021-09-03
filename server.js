const Koa = require('koa')
const Logger = require('koa-logger')
const Cors = require('@koa/cors')
const BodyParser = require('koa-bodyparser')
const Helmet = require('koa-helmet')
const respond = require('koa-respond')

const app = new Koa()
const router = require('./server/routes');

const sslify = require('koa-sslify').default; // http强制HTTPS

app.use(Helmet())

if (process.env.NODE_ENV === 'development') {
  app.use(Logger())
}

app.use(sslify()); // http强制HTTPS

app.use(Cors())
app.use(BodyParser({
  enableTypes: ['json'],
  jsonLimit: '5mb',
  strict: true,
  onerror: function (err, ctx) {
    ctx.throw('body parse error', 422)
  }
}))

app.use(respond())

// API routes
// require('./routes')(router)
// app.use(router.routes())
// app.use(router.allowedMethods())
// 路由
router(app);


module.exports = app
