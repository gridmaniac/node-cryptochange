const log = summon('log')(module)

const Statistic = model('statistic')

this.snap = (name, value) => {
    try {
        const statistic = 
            new Statistic({ name, value })

        statistic.save()
    } catch(e) {
        log.error(e)
    }

    return this
}

this.grasp = (name, start, end) => {
    return Statistic
        .find({ name, date: { $gte: start, $lte: end } })
        .lean()
        .sort({ date: 1 })
        .exec()
}

module.exports = this