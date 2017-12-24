const Router = require('koa-router'),
      router = new Router(),
      views = 'admin/views/'

const log = summon('log')(module),
      passport = require('koa-passport')

router.use('/', summon('auth').isAdminUnauthenticated)

router.get('/', (ctx, next) => {
    try {
        ctx.render(views + 'login')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/', (ctx, next) => {
    try {
        return passport.authenticate('login', (err, user) => {
            if (user === false) {
                const message = ctx.flash('error')

                if (message.length == 0) {
                    return ctx.render(views + 'login', { message: 'Необходимо заполнить все поля' })
                }

                ctx.render(views + 'login', { message })
            } else {
                ctx.login(user)
                ctx.redirect('/admin')
            }
        })(ctx)
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

module.exports = router