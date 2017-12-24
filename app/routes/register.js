const Router = require('koa-router'),
      router = new Router(),
      views = 'app/views/'

const log = summon('log')(module),
      passport = require('koa-passport'),
      isEmail = summon('is-email')

const Wallet = model('wallet')

router.use('/', summon('auth').isUnauthenticated)

router.get('/', async (ctx, next) => {
    try {
        const wallets = await Wallet
            .find({ active: true })
            .sort({ sort: 1 })
            .exec()

        ctx.setState('title', 'CryptoChange | Регистрация')
        ctx.render(views + 'register', { wallets })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/', async (ctx, next) => {
    try {
        const user = ctx.request.body

        if (!isEmail(user.email))
            return ctx.body = { err: 'Неверный формат Email' }

        if (user.password.length < 7)
            return ctx.body = { err: 'Длина пароля должна быть не менее 7 символов' }

        if (user.password.length > 18)
            return ctx.body = { err: 'Длина пароля должна быть не более 18 символов' }

        if (user.password != user.retry)
            return ctx.body = { err: 'Пароли не совпадают.' }
        
        return passport.authenticate('register', (err, user) => {
            if (user === false) {
                ctx.body = { err: ctx.flash('error')}
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