const log = summon('log')(module),
      getConfig = summon('get-config')

const Preset = model('preset')

module.exports = async () => {
    try {
        const config = await getConfig()

        const preset = await Preset
            .findOne({ name: config.preset })

        return preset
    } catch(e) {
        log.error(e)
    }
}