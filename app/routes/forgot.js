const Router = require('koa-router'),
      router = new Router(),
      views = 'app/views/'

const log = summon('log')(module),
      generator = require('generate-password'),
      mailer = summon('send-mail')

const Wallet = model('wallet'),
      User = model('user')

router.use('/', summon('auth').isUnauthenticated)

router.get('/', async (ctx, next) => {
    try {
        const wallets = await Wallet
            .find({ active: true })
            .sort({ sort: 1 })
            .exec()

        ctx.setState('title', 'CryptoChange | Восстановление пароля')
        ctx.render(views + 'forgot', { wallets })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/', async (ctx, next) => {
    try {
        const wallets = await Wallet
            .find({ active: true })
            .sort({ sort: 1 })
            .exec()

        const email = ctx.request.body.email
        if (!email) {
            return ctx.render(views + 'forgot', {
                wallets,
                message: 'Поле Email является обязательным'
            })
        }

        const user = await User.findOne({ email })

        if (!user) {
            return ctx.render(views + 'forgot', {
                wallets,
                email,
                message: 'Пользователь с таким Email не найден'
            })
        }
        
        const pass = generator.generate({
            length: 10,
            numbers: true
        })

        await User.update({ email }, {
            password: user.generateHash(pass)
        })

        mailer.notifyForgot(email, pass)

        ctx.render(views + 'forgot', {
            wallets,
            message: 'Новый пароль отправлен на укзаанный адрес'
        })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

module.exports = router