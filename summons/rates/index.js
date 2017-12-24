const oxr = summon('oxr'),
      fx = require('money'),
      schedule = require('node-schedule'),
      statistic = summon('statistic'),
      log = summon('log')(module),
      yaml = require('js-yaml'),
      fs = require('fs')

const Preset = model('preset')

const updateRates = async () => {
    try {
        const config = yaml.safeLoad(
            fs.readFileSync('config.yml', 'utf8'))

        const preset = await Preset
            .findOne({ name: config.preset })
        
        oxr.set({ app_id: preset.oxrKey })
        oxr.latest(() => {
            fx.rates = oxr.rates
            fx.base = 'USD'
            
            for(let rate of preset.rates.split(',')) {
                const from = rate.substring(0, 3).toUpperCase()
                const to = rate.substring(3, 6).toUpperCase()
                statistic.snap(rate, fx(1).from(from).to(to))
            }
        })
    } catch(e) {
        log.error(e)
    }
}

const job = schedule.scheduleJob((new Date()).getMinutes() + ' * * * *', () => {
    updateRates()
})

updateRates()

module.exports = (origin, target) => {
    fx.rates = oxr.rates
    fx.base = 'USD'
    return fx(1)
        .from(origin)
        .to(target)
}