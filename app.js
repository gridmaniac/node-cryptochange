'use strict'

require('./interop')
const log = summon('log')(module),
      yaml = require('js-yaml'),
      fs = require('fs')

const mongoose = require('mongoose')
      mongoose.Promise = require('bluebird')

const config = yaml.safeLoad(
      fs.readFileSync('config.yml', 'utf8'))

const ai = require('mongoose-auto-increment'),
      connection = mongoose.connect(
        `mongodb://${config.mongo.host}:${config.mongo.port}/${config.mongo.db}`, {
            useMongoClient: true
      })
      ai.initialize(connection)

const preset = summon('preset-loader')
      preset.load(config.preset)

const su = summon('super-user')
      su.make(config.admin)
      
const auth = summon('auth')
      auth.apply()

const orderKiller = summon('order-killer')
      orderKiller.start()

const rates = summon('rates')

const Koa = require('koa'),
      app = new Koa()

const session = require('koa-session'),
      flash = require('koa-connect-flash'),
      bodyParser = require('koa-bodyparser'),
      json = require('koa-json'),
      serve = require('koa-static'),
      mount = require('koa-mount'),
      passport = require('koa-passport'),
      Pug = require('koa-pug'),
      state = require('koa-state')

app.keys = ['hadouken']
app.use(session(app))
   .use(bodyParser({
        jsonLimit: '5mb',
        formLimit: '5mb',
        textLimit: '5mb'
   }))
   .use(json())
   .use(flash())
   .use(state())

app.use(passport.initialize())
   .use(passport.session())

app.use(serve(`${__dirname}/app/public`))
   .use(mount('/admin', serve(`${__dirname}/admin/public`)))
   .use(mount('/i', serve(`${__dirname}/app/docs/icons`)))
   .use(mount('/evidence', serve(`${__dirname}/app/docs/documents`)))

const status = summon('status')
app.use(async (ctx, next) => {
    ctx.setState('status', status.get())
    if (ctx.query.ref && ctx.isUnauthenticated()) {
        summon('follow')(ctx.query.ref)
        ctx.session.ref = ctx.query.ref
    }
    await next()
})

const dir = require('require-dir'),
      appRoutes = dir(`${__dirname}/app/routes`),
      adminRoutes = dir(`${__dirname}/admin/routes`)
      
for (let p in appRoutes) {
    appRoutes[p].prefix(p != 'index' ? `/${p}` : '/')
    app.use(appRoutes[p].routes())
}

for (let p in adminRoutes) {
    adminRoutes[p].prefix(p != 'index' ? `/admin/${p}` : '/admin/')
    app.use(adminRoutes[p].routes())
}

new Pug()
    .use(app)

const Page = model('page'),
      Wallet = model('wallet')

app.use(async (ctx, next) => {
    try {
        const page = await Page
            .findOne({ path: ctx.path })
        
        if (page) {
            const wallets = await Wallet
                .find({ active: true })
                .sort({ sort: 1 })
                .exec()

            ctx.setState('title', 'CryptoChange | ' + page.title)
            ctx.setState('description', page.description)

            ctx.render('app/views/page', { page, wallets })
        } else {
            next()
        }
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

app.use((ctx) => {
    ctx.render('404', { e: ctx.state.e || 'Ресурс не найден' })
})

app.listen(3000)