const Router = require('koa-router'),
      router = new Router(),
      views = 'admin/views/'

const log = summon('log')(module),
      paginate = require('koa-ctx-paginate'),
      mailer = summon('send-mail')

const Payout = model('payout'),
      User = model('user')

router.use('/', summon('auth').isAdminAuthenticated)
router.use(paginate.middleware(10, 10))

router.get('/', async (ctx, next) => {
    try {
        const query = {},
              httpQuery = ctx.request.query

        if (httpQuery.email) {
            const user = await User.findOne({ email: new RegExp(httpQuery.email, 'i') })
            query.user = user ? user._id : null
        }

        if (httpQuery.status) query.status = httpQuery.status
        
        const [ payouts, count ] = [
            await Payout
                .find(query)
                .limit(ctx.query.limit)
                .skip(ctx.paginate.skip)
                .sort({ _id: -1 })
                .populate('user')
                .exec(),

            await Payout
                .count(query)
        ]

        const pageCount = Math.ceil(count / ctx.query.limit)
        
        ctx.render(views + 'payouts', {
            payouts,
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

router.get('/confirm/:id', async (ctx, next) => {
    try {
        const payout = await Payout
            .findOne({ _id: parseInt(ctx.params.id) })
            .populate('user')
            .exec()

        if (payout.status == 0) {
            await Payout.update({ _id: parseInt(ctx.params.id) }, {
                status: 1
            })

            mailer.notifyCustomerPayout(payout.user.email, {
                status: 'Выплачено'
            })
        }

        ctx.redirect('back')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/reject/:id', async (ctx, next) => {
    try {
        const payout = await Payout
            .findOne({ _id: parseInt(ctx.params.id) })
            .populate('user')
            .exec()

        if (payout.status == 0) {
            await Payout.update({ _id: parseInt(ctx.params.id) }, {
                status: 2
            })

            mailer.notifyCustomerPayout(payout.user.email, {
                status: 'Отклонено'
            })
        }

        ctx.redirect('back')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

module.exports = router