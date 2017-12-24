const Router = require('koa-router'),
      router = new Router(),
      views = 'admin/views/'

const log = summon('log')(module)

router.use('/', summon('auth').isAdminAuthenticated)

router.get('/', (ctx, next) => {
    try {
        ctx.logout()
        ctx.redirect('/admin/login')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

module.exports = router