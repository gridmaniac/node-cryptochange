const Router = require('koa-router'),
      router = new Router(),
      views = 'app/views/'

const log = summon('log')(module),
      passport = require('koa-passport')

router.use('/', summon('auth').isAuthenticated)

router.get('/', async (ctx, next) => {
    try {
        ctx.logout()
        ctx.redirect('/')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

module.exports = router