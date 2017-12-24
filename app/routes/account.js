const Router = require('koa-router'),
      router = new Router(),
      views = 'app/views/'

const log = summon('log')(module),
      moment = require('moment'),
      getDiscount = summon('discount'),
      getPreset = summon('get-preset'),
      generator = require('generate-password'),
      mailer = summon('send-mail'),
      validateRequisites = summon('validate-requisites'),
      fs = require('fs')

const Wallet = model('wallet'),
      Order = model('order'),
      User = model('user'),
      UserRequisite = model('user-requisite'),
      Accrual = model('accrual'),
      Payout = model('payout')

router.use('/', summon('auth').isAuthenticated)

router.get('/', async (ctx, next) => {
    try {
        ctx.redirect('/account/orders')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/orders', async (ctx, next) => {
    try {
        const [ orders, wallets ] = [
            await Order
                .find({ user: parseInt(ctx.state.user.id) })
                .populate('twallet')
                .populate('owallet')
                .sort({ date: -1 })
                .exec(),
            await Wallet
                .find({ active: true })
                .sort({ sort: 1 })
                .exec()
        ]

        const user = await User.findOne({ _id: ctx.state.user.id })
        const discount = getDiscount(user.inflow)

        ctx.setState('title', 'CryptoChange | Мои обмены')
        ctx.render(views + '/orders', { orders, wallets, moment, discount, inflow: user.inflow })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/orders/dismiss/:id', async (ctx, next) => {
    try {
        const preset = await getPreset()

        const order = await Order
            .findOne({ _id: parseInt(ctx.params.id) })
            .populate('user')
            .exec()

        if (!order || order.user.id != ctx.state.user.id)
            return ctx.redirect('/')

        if (order.status == 0)
        await Order.update({ _id: order.id }, {
            status: 4
        })

        mailer.notifyCustomerOrderStatus(order.user.email, {
            id: order.id,
            status: 'Заявка отклонена'
        })

        ctx.redirect('back')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/orders/:id', async (ctx, next) => {
    try {
        const preset = await getPreset()

        const order = await Order
            .findOne({ _id: parseInt(ctx.params.id) })
            .populate('user')
            .populate('twallet')
            .populate('owallet')
            .exec()

        if (!order || order.user.id != ctx.state.user.id)
            return ctx.redirect('/')

        if (order.status == 3 || order.status == 4)
            return ctx.redirect('/')

        const showPayButton = order.twallet.paybutton &&
            ((order.owallet.verification && order.status == 0 && order.phase == 2) ||
            (!order.owallet.verification && order.status == 0))

        const showEvidence = order.owallet.verification &&
            (order.status == 0 && order.phase != 2)

        const showVerification = order.owallet.verification &&
            (order.status == 0 && (order.phase == 0 || order.phase == 3 ))

        const showPayment = !showEvidence && order.status == 0

        const showWaitVerification = showEvidence && order.phase == 1

        let sign = ''
        if (order.owallet.hashplate) {
            sign = order.owallet.hashplate
            sign = sign.replace(/{{id}}/g, order.id)
            sign = sign.replace(/{{id}}/g, order.code)
            sign = sign.replace(/{{id}}/g, order.sum)
            sign = require('sha256')(sign)
        }

        let emb = order.owallet.embedded
        emb = emb.replace(/{{id}}/g, order.id)
        emb = emb.replace(/{{code}}/g, order.owallet.code)
        emb = emb.replace(/{{sum}}/g, order.osum)
        emb = emb.replace(/{{email}}/g, order.user.email)
        emb = emb.replace(/{{sign}}/g, sign)

        const payment = emb
        
        ctx.setState('title', 'CryptoChange | Заявка на обмен')
        ctx.render(views + '/order', {
            order, 
            orderLifetime: preset.orderLifetime, 
            showPayButton, 
            showVerification,
            showEvidence,
            showPayment,
            showWaitVerification,
            payment
        })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/orders/document', async (ctx, next) => {
    try {
        const data = ctx.request.body.document.replace(/^data:image\/\w+;base64,/, '')
        if (!data) return ctx.body = { err: 'Выберите файл' }

        const guid = generator.generate({
            length: 16,
            numbers: true
        })

        const name = ctx.request.body.name

        const buf = new Buffer(data, 'base64'),
              path = './app/docs/documents/' + guid + '.' + name.split('.').pop()
    
        if (fs.existsSync(path))
            fs.unlinkSync(path)
        
        fs.writeFileSync(path, buf)

        const preset = await getPreset()

        const order = await Order
            .findOne({ _id: parseInt(ctx.request.body.id) })
            .populate('user')
            .populate('owallet')
            .populate('twallet')
            .exec()

        if (!order || order.user.id != ctx.state.user.id)
            return ctx.redirect('/')

        const deadLine = moment(order.date)
            .add(preset.orderLifetime, 'minutes')

        if (new Date() > deadLine.toDate())
            return ctx.redirect('/')

        if (order.status == 0)
        await Order.update({ _id: order.id }, {
            phase: 1,
            evidence: guid + '.' + name.split('.').pop()
        })

        const userRequisite = await UserRequisite
            .findOne({
                user: ctx.state.user.id,
                values: order.orequisites,
                wallet: order.owallet.id
            }) 
        
        if (userRequisite) {
            await UserRequisite.update({ _id: userRequisite.id }, {
                phase: 1,
                evidence: guid + '.' + name.split('.').pop()
            }) 
        }

        const operators = await User
            .find({ role: true })

        mailer.notifyOperatorsDocument(operators, {
            link: 'http://cryptochange.com/admin/orders/' + order.id
        })

        ctx.body = {}
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/orders/ready', async (ctx, next) => {
    try {
        const preset = await getPreset()

        const order = await Order
            .findOne({ _id: parseInt(ctx.request.body.id) })
            .populate('user')
            .populate('owallet')
            .populate('twallet')
            .exec()

        if (!order || order.user.id != ctx.state.user.id)
            return ctx.redirect('/')

        const deadLine = moment(order.date)
            .add(preset.orderLifetime, 'minutes')

        if (new Date() > deadLine.toDate())
            return ctx.redirect('/')

        if (order.status == 0)
        await Order.update({ _id: order.id }, {
            status: 1
        })

        mailer.notifyCustomerOrderStatus(order.user.email, {
            id: order.id,
            status: 'Ожидает подтверждения'
        })

        const operators = await User
            .find({ role: true })

        mailer.notifyOperatorsOrder(operators, {
            id: order.id,
            origin: order.owallet.title,
            osum: order.osum,
            ocode: order.owallet.code,
            target: order.twallet.title,
            tsum: order.tsum,
            tcode: order.twallet.code,
            link: 'http://cryptochange.com/admin/orders/' + order.id
        })

        ctx.redirect('back')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/password', async (ctx, next) => {
    try {
        const wallets = await Wallet
            .find({ active: true })
            .sort({ sort: 1 })
            .exec()
        
            ctx.setState('title', 'CryptoChange | Смена пароля')
        ctx.render(views + 'password', { wallets })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/password', async (ctx, next) => {
    try {
        const wallets = await Wallet
            .find({ active: true })
            .sort({ sort: 1 })
            .exec()

        const pass = ctx.request.body.password,
              newpass = ctx.request.body.new,
              retry = ctx.request.body.retry

        if (!pass || !newpass || !retry) {
            return ctx.render(views + 'password', {
                wallets,
                message: 'Все поля являются обязательными'
            })
        }

        const user = await User.findOne({ _id: ctx.state.user.id })
        if (!user.validPassword(pass)) {
            return ctx.render(views + 'password', {
                wallets,
                message: 'Текущий пароль неверный'
            })
        }

        if (newpass.length < 7)
            return ctx.render(views + 'password', {
                wallets,
                message: 'Длина пароля должна быть не менее 7 символов'
            })

        if (newpass.length > 18)
            return ctx.render(views + 'password', {
                wallets,
                message: 'Длина пароля должна быть не более 18 символов'
            })

        if (newpass != retry) {
            return ctx.render(views + 'password', {
                wallets,
                message: 'Пароли не совпадают'
            })
        }

        await User.update({ email: user.email }, {
            password: user.generateHash(newpass)
        })

        ctx.render(views + 'password', {
            wallets,
            message: 'Пароль успешно изменен'
        })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/requisites', async (ctx, next) => {
    try {
        const wallets = await Wallet
            .find({ active: true })
            .sort({ sort: 1 })
            .populate('requisites')
            .exec()

        const userRequisites = await UserRequisite
            .find({ user: ctx.state.user.id })
            .populate('wallet')
            .exec()
        
        ctx.setState('title', 'CryptoChange | Мои реквизиты')
        ctx.render(views + 'requisites', { wallets, wallet: wallets[0], userRequisites })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/requisites/:alias', async (ctx, next) => {
    try {
        const wallet = await Wallet
            .findOne({ alias: ctx.params.alias })
            .populate('requisites')
            .exec()
        
        ctx.body = wallet
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/requisites/add', async (ctx, next) => {
    try {
        const data = JSON.parse(ctx.request.body.data)

        const wallet = await Wallet
            .findOne({ alias: data.wallet })
            .populate('requisites')
            .exec()

        const { valid, err } =
            validateRequisites(wallet.requisites, data.requisites)

        if (!valid)
            return ctx.body = { err }

        const count = await UserRequisite
            .count({
                user: ctx.state.user.id,
                wallet: wallet.id,
                values: data.requisites
            })
        
        if (count > 0)
            return ctx.body = { err: 'Такой реквизит уже добавлен' }

        const userRequisite = new UserRequisite({
            user: ctx.state.user.id,
            wallet: wallet.id,
            values: data.requisites
        })
        await userRequisite.save()

        ctx.body = {}
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/requisites/remove', async (ctx, next) => {
    try {
        const id = ctx.request.body.id

        const userRequisite = await UserRequisite
            .findOne({ _id: id })

        if (userRequisite.user == ctx.state.user.id) {
            await UserRequisite.remove({ _id: id })
        }

        ctx.redirect('back')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/affiliate', async (ctx, next) => {
    try {
        const [ wallets, user, friends, accruals, payouts ] = [
            await Wallet
                .find({ active: true })
                .sort({ sort: 1 })
                .exec(),
            await User
                .findOne({ _id: ctx.state.user.id }),
            await User
                .find({ referrer: ctx.state.user.id }),
            await Accrual
                .find({ user: ctx.state.user.id }),
            await Payout
                .find({ user: ctx.state.user.id })
        ]

        ctx.setState('title', 'Партнерская программа')
        ctx.render(views + 'affiliate', {
            wallets,
            usr: user,
            friends,
            accruals,
            payouts,
            moment
        })

    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/affiliate', async (ctx, next) => {
    try {
        const payout = new Payout({
            user: ctx.state.user.id,
            sum: ctx.request.body.sum,
            destination: ctx.request.body.destination
        })

        await payout.save()
        ctx.redirect('back')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

module.exports = router