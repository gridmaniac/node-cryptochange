const Router = require('koa-router'),
      router = new Router(),
      views = 'admin/views/'
    
const log = summon('log')(module),
      paginate = require('koa-ctx-paginate'),
      moment = require('moment')

const User = model('user'),
      UserRequisite = model('user-requisite'),
      Order = model('order'),
      Accrual = model('accrual')

router.use('/', summon('auth').isAdminAuthenticated)
router.use(paginate.middleware(10, 10))

router.get('/', async (ctx, next) => {
    try {
        const query = {},
              httpQuery = ctx.request.query

        if (httpQuery.email) {
            query.email = new RegExp(httpQuery.email, 'i')
        }

        if (httpQuery.referrer) {
            const referrer = await User.findOne({ email: new RegExp(httpQuery.referrer, 'i') })
            query.referrer = referrer.id
        }

        if (httpQuery.role) query.role = httpQuery.role
        
        const [ users, count ] = [
            await User
                .find(query)
                .limit(ctx.query.limit)
                .skip(ctx.paginate.skip)
                .sort({ _id: -1 })
                .populate('referrer')
                .exec(),

            await User
                .count(query)
        ]

        const pageCount = Math.ceil(count / ctx.query.limit)
        
        ctx.render(views + 'users', {
            users,
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

router.get('/:id', async (ctx, next) => {
    try {
        const [ usr, requisites, count, accruals, aCount] = [
            await User
                .findOne({ _id: parseInt(ctx.params.id) }),
            
            await UserRequisite
                .find({ user: ctx.params.id })
                .populate('wallet')
                .exec(),

            await User.count({ referrer: ctx.params.id }),
            await Accrual
                .find({ user: ctx.params.id })
                .limit(ctx.query.limit)
                .skip(ctx.paginate.skip)
                .sort({ date: -1 })
                .exec(),
            await Accrual.count({ user: ctx.params.id })
        ]

        const pageCount = Math.ceil(aCount / ctx.query.limit)
        
        ctx.render(views + 'user', {
            usr,
            count,
            requisites,
            accruals,
            moment,
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

router.post('/update', async (ctx, next) => {
    try {
        const user = ctx.request.body,
              id = user.id

        Object.keys(user).forEach((key) => 
            (user[key] == '') && delete user[key])

        await User.findOneAndUpdate({ _id: parseInt(id) }, { $set: user })
        ctx.redirect(`/admin/users/${id}`)
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/requisites/remove', async (ctx, next) => {
    try {
        const id = ctx.request.body.id
        await UserRequisite.remove({ _id: parseInt(id) })
        ctx.redirect(`/admin/users/` + ctx.request.body.user)
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/requisites/verify/:id', async (ctx, next) => {
    try {
        const userRequisite = await UserRequisite
            .findOne({ _id: parseInt(ctx.params.id) })

        userRequisite.phase = 2
        await userRequisite.save()

        await Order.update({ 
                user: userRequisite.user,
                owallet: userRequisite.wallet
             }, { phase: 2 })

        ctx.redirect('back')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/requisites/prohibit/:id', async (ctx, next) => {
    try {
        const userRequisite = await UserRequisite
            .findOne({ _id: parseInt(ctx.params.id) })

        userRequisite.phase = 3
        await userRequisite.save()

        await Order.update({ 
                user: userRequisite.user,
                owallet: userRequisite.wallet
             }, { phase: 3 })

        ctx.redirect('back')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

module.exports = router