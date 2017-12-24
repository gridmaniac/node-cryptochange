const Router = require('koa-router'),
      router = new Router(),
      views = 'admin/views/'
    
const log = summon('log')(module),
      cts = summon('code-to-symbol')

const Requisite = model('requisite'),
      Wallet = model('wallet')  

router.use('/', summon('auth').isAdminAuthenticated)

router.get('/', async (ctx, next) => {
    try {
        const requisites = await Requisite
            .find({})
            .sort({ alias: 1 })
            .exec()
        
        for (let requisite of requisites) {
            const count = await Wallet.count({ requisites: requisite.id })
            if (count > 0) {
                requisite.involved = true
            }
        }

        ctx.render(views + 'requisites', { requisites })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/new', async (ctx, next) => {
    try {
        ctx.setState('pending', true)
        ctx.render(views + 'requisite', { requisite: {} })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/:id', async (ctx, next) => {
    try {
        const requisite = await Requisite
            .findOne({ _id: parseInt(ctx.params.id) })
        
        const count = await Wallet.count({ requisites: requisite.id })
        if (count > 0) {
            requisite.involved = true
        }

        ctx.render(views + 'requisite', { requisite })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/update', async (ctx, next) => {
    try {
        const requisite = ctx.request.body,
              id = requisite.id

        await Requisite.findOneAndUpdate({ _id: parseInt(id) }, { $set: requisite })
        ctx.redirect(`/admin/requisites/${id}`)
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/remove', async (ctx, next) => {
    try {
        const id = ctx.request.body.id

        const requisite = await Requisite
            .findOne({ _id: parseInt(id) })

        const count = await Wallet.count({ requisites: requisite.id })
        if (count === 0) {
            await Requisite.remove({ _id: parseInt(id) })
        }
        
        ctx.redirect(`/admin/requisites`)
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/new', async (ctx, next) => {
    try {
        let requisite = ctx.request.body,
            messages = []
        ctx.setState('pending', true)

        if (!requisite.title)
            messages.push('Не заполнено поле <b>Наименование</b>')

        if (!requisite.alias)
            messages.push('Не заполнено поле <b>Псевдоним</b>')

        if (messages.length > 0) {
            return ctx.render(views + 'requisite', { requisite, messages })
        }
        
        requisite = new Requisite(requisite)

        const { id } = await requisite.save()
        ctx.redirect(`/admin/requisites/${id}`)
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

module.exports = router