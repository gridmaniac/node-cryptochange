const log = summon('log')(module)

const Preset = model('preset')

this.load = async (name) => {
    try {
        const count = await Preset.count({ name })
        if (count === 0) {
            const preset = new Preset({ name })
            await preset.save()
        }
    } catch(e) {
        log.error(e)
    }
}

module.exports = this