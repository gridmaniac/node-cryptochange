const Router = require('koa-router'),
      router = new Router(),
      views = 'admin/views/'

const log = summon('log')(module), 
      status = summon('status'),
      sizeOf = require('image-size'),
      fs = require('fs'),
      getPreset = summon('get-preset'),
      moment = require('moment'),
      statistic = summon('statistic')

const Wallet = model('wallet'),
      Order = model('order')

router.use('/', summon('auth').isAdminAuthenticated)

router.get('/', async (ctx, next) => {
    try {
        const today = moment(),
              weekAgo = moment().subtract(1, 'week'),
              monthAgo = moment().subtract(1, 'month')

        const [ wallets, preset, weekOrders, weekDueOrders ] = [
            await Wallet
                .find({ active: true })
                .sort({ sort: 1 })
                .exec(),
            await getPreset(),
            await Order
                .count({ date: { $gte: weekAgo } }),
            await Order
                .count({ date: { $gte: weekAgo }, status: 3 })
        ]

        const rates = preset.rates.split(',')
            .map(x => x.toUpperCase())

        let dueRatio = ((weekDueOrders / weekOrders) * 100).toFixed(0)
        if (isNaN(dueRatio)) dueRatio = 0

        const incomes = 
            await statistic.grasp('INCOME', weekAgo, today)
        
        let weekIncome = 0
        for (let income of incomes) {
            weekIncome += Math.abs(parseFloat(income.value))
        }
        
        weekIncome = weekIncome.toFixed(2)

        const [ regStat, refStat] = [
            await statistic.grasp('REG', monthAgo, today),
            await statistic.grasp('REF', monthAgo, today),
        ]

        const monthRegs = regStat.length
        let userRatio = ((refStat.length / regStat.length) * 100).toFixed(0)
        if (isNaN(userRatio)) userRatio = 0

        ctx.render(views + 'index', { wallets, rates, weekOrders, dueRatio, weekIncome, monthRegs, userRatio })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.get('/switch', async (ctx, next) => {
    try {
        status.switch()
        ctx.redirect('back')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/i', async (ctx, next) => {
    try {
        const data = ctx
            .request
            .body
            .icon
            .replace(/^data:image\/\w+;base64,/, '')
        
        const buf = new Buffer(data, 'base64'),
              path = `./app/docs/icons/${ctx.request.body.name}`

        if (fs.existsSync(path))
            fs.unlinkSync(path)
        
        fs.writeFileSync(path, buf)
        
        const d = sizeOf(path)
        if (d.width == 25 && d.height == 25) {
            ctx.body = { path: ctx.request.body.name }
        } else {
            fs.unlinkSync(path)
            ctx.body = { err: 'Некорректный формат иконки. Требуется изображение 25x25 пикселей.' }
        }
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

module.exports = router