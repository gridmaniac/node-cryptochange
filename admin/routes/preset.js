const Router = require('koa-router'),
      router = new Router(),
      views = 'admin/views/'

const log = summon('log')(module),
      fs = require('fs'),
      getConfig = summon('get-config',)
      getPreset = summon('get-preset')

const Preset = model('preset')

router.use('/', summon('auth').isAdminAuthenticated)

router.get('/', async (ctx, next) => {
    try {
        const preset = await getPreset()
        
        let log = ''
        if (fs.existsSync('./log/crashes.log'))
            log = fs.readFileSync('./log/crashes.log', 'utf8')
        
        ctx.render(views + 'preset', { preset, log })
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/update', async (ctx, next) => {
    try {
        const preset = ctx.request.body,
              config = await getConfig()

        Object.keys(preset).forEach((key) => 
            (preset[key] == '') && delete preset[key])

        await Preset.findOneAndUpdate({ name: config.preset }, { $set: preset })
        
        ctx.redirect('back')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

router.post('/clearlog', async (ctx, next) => {
    try {
        if (fs.existsSync('./log/crashes.log'))
            fs.writeFileSync('./log/crashes.log', '')
        ctx.redirect('back')
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})


module.exports = router