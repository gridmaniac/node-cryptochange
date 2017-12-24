const Router = require('koa-router'),
      router = new Router(),
      views = 'app/views/'

const log = summon('log')(module),
      rates = summon('rates'),
      getDiscount = summon('discount'),
      getPreset = summon('get-preset')

const Wallet = model('wallet'),
      User = model('user'),
      Order = model('order'),
      UserRequisite = model('user-requisite')

router.get('/', async (ctx, next) => {
    try {
        if (ctx.isAuthenticated()) {
            const order = await Order
                .findOne({
                    $and: [
                        { user: ctx.state.user.id },
                        { $or: [
                            { status: 0 },
                            { status: 1 },
                            { status: 2 }
                        ]}
                    ]})
                .exec()
            
            if (order)
                return ctx.redirect(`/account/orders/${order.id}`)
        }

        const preset = await getPreset()

        const [ wallets, origin, target] = [
            await Wallet
                .find({ active: true })
                .sort({ sort: 1 })
                .exec(),
            await Wallet
                .findOne({ active: true, alias: preset.defaultOrigin })
                .populate('requisites')
                .exec(),
            await Wallet
                .findOne({ active: true, alias: preset.defaultTarget })
                .populate('requisites')
                .exec()
        ]

        if (!origin || !target)
            return ctx.render('404', { e: 'Проверьте корректность настройки направлений обмена.' })

        let discount = 0
        if (ctx.isAuthenticated()) {
            const user = await User.findOne({ _id: ctx.state.user.id })
            discount = getDiscount(user.inflow)
        }

        const rawrates = rates(origin.code, target.code),
              fee = rawrates * (target.fee - discount) * 0.01

        let originUserRequisites = [],
              targetUserRequisites = []

        if (ctx.isAuthenticated()) {
            const [ oUserRequisites, tUserRequisites ] = [
                await UserRequisite
                    .find({ user: ctx.state.user.id, wallet: origin }),
                await UserRequisite
                    .find({ user: ctx.state.user.id, wallet: target })
            ]

            originUserRequisites = oUserRequisites
            targetUserRequisites = tUserRequisites
        }

        ctx.setState('title', `CryptoChange | Обмен ${origin.title} на ${target.title}`)
        ctx.render(views + 'index', {
            rates: (rawrates - fee).toFixed(9),
            wallets,
            origin,
            target,
            discount,
            originUserRequisites,
            targetUserRequisites
        })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/obmen-:origin-na-:target', async (ctx, next) => {
    try {
        if (ctx.isAuthenticated()) {
            const order = await Order
                .findOne({
                    $and: [
                        { user: ctx.state.user.id },
                        { $or: [
                            { status: 0 },
                            { status: 1 },
                            { status: 2 }
                        ]}
                    ]})
                .exec()
            
            if (order)
                return ctx.redirect(`/account/orders/${order.id}`)
        }
        
        const o = ctx.params.origin,
              t = ctx.params.target

        if (o == t) return ctx.redirect('/')

        const [ wallets, origin, target ] = [
            await Wallet
                .find({ active: true })
                .sort({ sort: 1 })
                .exec(),
            await Wallet
                .findOne({ alias: o })
                .populate('requisites')
                .exec(),
            await Wallet
                .findOne({ alias: t })
                .populate('requisites')
                .exec()
        ]

        let discount = 0
        if (ctx.isAuthenticated()) {
            const user = await User.findOne({ _id: ctx.state.user.id })
            discount = getDiscount(user.inflow)
        }

        const rawrates = rates(origin.code, target.code),
              fee = rawrates * (target.fee - discount) * 0.01

        let originUserRequisites = [],
            targetUserRequisites = []

        if (ctx.isAuthenticated()) {
            const [ oUserRequisites, tUserRequisites ] = [
                await UserRequisite
                    .find({ user: ctx.state.user.id, wallet: origin }),
                await UserRequisite
                    .find({ user: ctx.state.user.id, wallet: target })
            ]

            originUserRequisites = oUserRequisites
            targetUserRequisites = tUserRequisites
        }

        ctx.setState('title', `CryptoChange | Обмен ${origin.title} на ${target.title}`)
        ctx.render(views + 'index', {
            rates: (rawrates - fee).toFixed(9),
            wallets,
            origin,
            target,
            discount,
            originUserRequisites,
            targetUserRequisites
        })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

module.exports = router