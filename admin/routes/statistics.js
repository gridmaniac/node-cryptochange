const Router = require('koa-router'),
      router = new Router()
    
const log = summon('log')(module),
      statistic = summon('statistic'),
      moment = require('moment')

router.use('/', summon('auth').isAdminAuthenticated)

router.get('/rates/:name', async (ctx, next) => {
    try {
        const end = new Date()
        const start = moment(end).subtract(2, 'week')
        const rates = 
            await statistic.grasp(ctx.params.name, start, end)
        ctx.body = rates
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/balances/:name', async (ctx, next) => {
    try {
        const end = new Date()
        const start = moment(end).subtract(1, 'month')
        const balances = 
            await statistic.grasp(ctx.params.name, start, end)
        ctx.body = balances
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

module.exports = router