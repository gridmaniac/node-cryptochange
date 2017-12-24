const Router = require('koa-router'),
      router = new Router(),
      views = 'admin/views/'
    
const log = summon('log')(module),
      cts = summon('code-to-symbol'),
      paginate = require('koa-ctx-paginate'),
      moment = require('moment'),
      getDiscount = summon('discount'),
      mailer = summon('send-mail'),
      statistic = summon('statistic'),
      getRates = summon('rates')

const Order = model('order'),
      Wallet = model('wallet'),
      Requisite = model('requisite'),
      User = model('user'),
      UserRequisite = model('user-requisite'),
      Accrual = model('accrual')

router.use('/', summon('auth').isAdminAuthenticated)
router.use(paginate.middleware(15, 15))

router.get('/', async (ctx, next) => {
    try {
        const query = {},
              httpQuery = ctx.request.query

        if (httpQuery.id) query._id = httpQuery.id
        if (httpQuery.user) {
            const user = await User.findOne({ email: new RegExp(httpQuery.user, 'i') })
            query.user = user ? user._id : null
        }

        if (httpQuery.status) query.status = httpQuery.status

        const [ orders, count ] = [
            await Order
                .find(query)
                .limit(ctx.query.limit)
                .skip(ctx.paginate.skip)
                .populate('user')
                .populate('twallet')
                .populate('owallet')
                .sort({ date: -1 })
                .exec(),

            await Order
                .count(query)
        ]

        const pageCount = Math.ceil(count / ctx.query.limit)

        ctx.render(views + 'orders', {
            orders,
            cts,
            moment,
            query: ctx.request.query,
            pageCount,
            currentPage: ctx.query.page,
            pages: paginate.getArrayPages(ctx)(5, pageCount, ctx.query.page)
        })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/accept/:id', async (ctx, next) => {
    try {
        const order = await Order
            .findOne({ _id: parseInt(ctx.params.id) })
            .populate('user')
            .exec()

        if (order.status == 1) {
            await Order.update({ _id: parseInt(ctx.params.id) }, {
                operator: ctx.state.user.id,
                status: 2
            })

            mailer.notifyCustomerOrderStatus(order.user.email, {
                id: order.id,
                status: 'В обработке'
            })
        }

        ctx.redirect('back')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/close/:id', async (ctx, next) => {
    try {
        const order = await Order
            .findOne({ _id: parseInt(ctx.params.id) })
            .populate('user')
            .exec()

        if (order.status == 2 && order.operator == ctx.state.user.id) {
            const owallet = await Wallet
                    .findOne({ _id: order.owallet })
                    .populate('owallet')
                    .exec()
                  owallet.balance += order.osum
            await owallet.save()

            statistic.snap(owallet.alias, owallet.balance)

            const twallet = await Wallet.findOne({ _id: order.twallet })
                  twallet.balance -= order.tsum
            await twallet.save()

            statistic.snap(twallet.alias, twallet.balance)

            await Order.update({ _id: parseInt(ctx.params.id) }, {
                status: 3
            })

            const user = await User
                .findOne({ _id: order.user.id})
                .populate('referrer')
                .exec()
            const rates = getRates(owallet.code, 'USD')
            user.inflow += order.osum * rates
            user.inflow = user.inflow.toFixed(owallet.fixto)
            await user.save()

            const income = ((order.tsum * 100) / (100 - twallet.fee) - order.tsum) * getRates(twallet.code, 'USD')
            statistic.snap('INCOME', income)

            if (user.referrer) {
                const bonus = (order.osum * 0.006)

                const accrual = new Accrual({
                    user: user.referrer,
                    sum: (bonus * rates).toFixed(2),
                    source: order.id,
                    originator: user.email
                })
                await accrual.save()

                user.referrer.accrual += (bonus * rates).toFixed(2)
                await user.referrer.save()
            }
            
            mailer.notifyCustomerOrderStatus(order.user.email, {
                id: order.id,
                status: 'Заявка выполнена'
            })
        }

        ctx.redirect('back')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/dismiss/:id', async (ctx, next) => {
    try {
        const order = await Order
            .findOne({ _id: parseInt(ctx.params.id) })
            .populate('user')
            .exec()

        if (order.status == 2 && order.operator == ctx.state.user.id) {
            await Order.update({ _id: parseInt(ctx.params.id) }, {
                status: 4
            })

            mailer.notifyCustomerOrderStatus(order.user.email, {
                id: order.id,
                status: 'Заявка отклонена'
            })
        }

        ctx.redirect('back')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/:id', async (ctx, next) => {
    try {
        const order = await Order
            .findOne({ _id: parseInt(ctx.params.id) })
            .populate('user')
            .populate('operator')
            .populate('twallet')
            .populate('owallet')
            .exec()
        
        const wallets = await Wallet.find({})

        let discount = 0
        if (order.user)
            discount = getDiscount(order.user.inflow)
        
        ctx.render(views + 'order', { order, wallets, cts, discount })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/update', async (ctx, next) => {
    try {
        const order = ctx.request.body,
              id = order.id

        Object.keys(order).forEach((key) => 
            (order[key] == '') && delete order[key])

        await Order.findOneAndUpdate({ _id: parseInt(id) }, { $set: order })
        ctx.redirect(`/admin/orders/${id}`)
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/remove', async (ctx, next) => {
    try {
        const id = ctx.request.body.id
        await Order.remove({ _id: parseInt(id) })
        ctx.redirect('/admin/orders')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/requisites/verify/:id', async (ctx, next) => {
    try {
        const order = await Order
            .findOne({ _id: parseInt(ctx.params.id) })
        
        if (order.phase == 1) {
            await Order.update({ _id: parseInt(ctx.params.id) }, {
                phase: 2
            })

            const userRequisite = await UserRequisite
                .findOne({
                    values: order.orequisites,
                    wallet: order.owallet,
                    user: order.user
                })

            if (userRequisite) {
                userRequisite.phase = 2
                await userRequisite.save()
            }
        }

        ctx.redirect('back')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/requisites/prohibit/:id', async (ctx, next) => {
    try {
        const order = await Order
            .findOne({ _id: parseInt(ctx.params.id) })
        
        if (order.phase == 1) {
            await Order.update({ _id: parseInt(ctx.params.id) }, {
                phase: 3
            })

            const userRequisite = await UserRequisite
                .findOne({
                    values: order.orequisites,
                    wallet: order.owallet,
                    user: order.user
                })

            if (userRequisite) {
                userRequisite.phase = 3
                await userRequisite.save()
            }
        }

        ctx.redirect('back')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

module.exports = router