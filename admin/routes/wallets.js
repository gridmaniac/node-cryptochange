const Router = require('koa-router'),
      router = new Router(),
      views = 'admin/views/'
    
const log = summon('log')(module),
      cts = summon('code-to-symbol'),
      getWithheld = summon('withheld'),
      statistic = summon('statistic')

const Wallet = model('wallet'),
      Requisite = model('requisite')

router.use('/', summon('auth').isAdminAuthenticated)

router.get('/', async (ctx, next) => {
    try {
        const wallets = await Wallet
            .find({})
            .sort({ active: -1, sort: 1 })
            .exec()

        ctx.render(views + 'wallets', {
            wallets,
            cts
        })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/new', async (ctx, next) => {
    try {
        const requisites = await Requisite
            .find({})
            .sort({ alias: 1 })
            .exec()
        ctx.setState('pending', true)
        ctx.render(views + 'wallet', { requisites, wallet: {} })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/activate', async (ctx, next) => {
    try {
       const id = ctx.query.id
       await Wallet
            .findOneAndUpdate({ _id: parseInt(id) }, { $set: { active: true } })
       ctx.redirect(`/admin/wallets/${id}`)
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/deactivate', async (ctx, next) => {
    try {
       const id = ctx.query.id
       await Wallet
            .findOneAndUpdate({ _id: parseInt(id) }, { $set: { active: false } })
       ctx.redirect(`/admin/wallets/${id}`)
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/:id', async (ctx, next) => {
    try {
        const [ wallet, requisites ] = [
            await Wallet
                .findOne({ _id: parseInt(ctx.params.id) }),
            
            await Requisite
                .find({})
                .sort({ alias: 1 })
                .exec()
        ]

        const withheld = await getWithheld(ctx.params.id)
        
        ctx.render(views + 'wallet', { wallet, requisites, withheld, cts })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/update', async (ctx, next) => {
    try {
        const wallet = ctx.request.body,
              id = wallet.id

        if (!wallet.requisites)
            wallet.requisites = []

        await Wallet.findOneAndUpdate({ _id: parseInt(id) }, { $set: wallet })
        statistic.snap(wallet.alias, wallet.balance)
    
        ctx.redirect(`/admin/wallets/${id}`)
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/new', async (ctx, next) => {
    try {
        let wallet = ctx.request.body,
            messages = []
        ctx.setState('pending', true)

        if (!wallet.title)
            messages.push('Не заполнено поле <b>Наименование</b>')

        if (!wallet.alias)
            messages.push('Не заполнено поле <b>Псевдоним</b>')
        
        if (!wallet.code)
            messages.push('Не заполнено поле <b>Код</b>')

        if (messages.length > 0) {
            const requisites = await Requisite
                .find({})
                .sort({ alias: 1 })
                .exec()
            return ctx.render(views + 'wallet', { wallet, messages, requisites })
        }

        Object.keys(wallet).forEach((key) => 
            (wallet[key] == '') && delete wallet[key])
        
        wallet = new Wallet(wallet)

        const { id } = await wallet.save()

        ctx.redirect(`/admin/wallets/${id}`)
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

module.exports = router