const Router = require('koa-router'),
      router = new Router(),
      views = 'admin/views/'
    
const log = summon('log')(module),
      paginate = require('koa-ctx-paginate')

const Page = model('page')
      
router.use('/', summon('auth').isAdminAuthenticated)
router.use(paginate.middleware(15, 15))

router.get('/', async (ctx, next) => {
    try {
        const [ pgs, count ] = [
            await Page
                .find({})
                .limit(ctx.query.limit)
                .skip(ctx.paginate.skip)
                .sort({ _id: -1 })
                .exec(),

            await Page
                .count({})
        ]

        const pageCount = Math.ceil(count / ctx.query.limit)
        
        ctx.render(views + 'pages', {
            pgs,
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

router.get('/new', async (ctx, next) => {
    try {
        ctx.setState('pending', true)
        ctx.render(views + 'page', { page: {} })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/:id', async (ctx, next) => {
    try {
        const page = await Page
            .findOne({ _id: parseInt(ctx.params.id) })
        
        ctx.render(views + 'page', { page })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/update', async (ctx, next) => {
    try {
        const page = ctx.request.body,
              id = page.id

        await Page.findOneAndUpdate({ _id: parseInt(id) }, { $set: page })
        ctx.redirect(`/admin/pages/${id}`)
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/remove', async (ctx, next) => {
    try {
        const id = ctx.request.body.id
        await Page.remove({ _id: parseInt(id) })
        ctx.redirect(`/admin/pages`)
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/new', async (ctx, next) => {
    try {
        let page = ctx.request.body
        page = new Page(page)

        const { id } = await page.save()
        ctx.redirect(`/admin/pages/${id}`)
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

module.exports = router