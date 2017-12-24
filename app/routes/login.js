const Router = require('koa-router'),
      router = new Router(),
      views = 'app/views/'

const log = summon('log')(module),
      passport = require('koa-passport')

router.use('/', summon('auth').isUnauthenticated)

router.post('/', async (ctx, next) => {
    try {
        return passport.authenticate('login', (err, user) => {
            if (user === false) {
                const err = ctx.flash('error')
                if (err.length == 0) {
                    return ctx.body = { err: 'Необходимо заполнить все поля' }
                }

                ctx.body = { err }
            } else {
                ctx.login(user)
                ctx.body = {}
            }
        })(ctx)
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

module.exports = router