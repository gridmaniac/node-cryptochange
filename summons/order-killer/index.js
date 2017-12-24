const schedule = require('node-schedule'),
      moment = require('moment'),
      log = summon('log')(module),
      getPreset = summon('get-preset'),
      mailer = summon('send-mail')

const Order = model('order')

this.feed = async x => {
    try {
        const preset = await getPreset()

        const order = await Order
            .findOne({ _id: x })
            .exec()

        const deadLine = moment(order.date)
            .add(preset.orderLifetime, 'minutes')

        schedule.scheduleJob(deadLine.toDate(), async () => {
            const order = await Order
                .findOne({ _id: x })
                .populate('user')
                .exec()

            if (order.status == 0) {
                await Order.update({ _id: x }, {
                    status: 4
                })

                mailer.notifyCustomerOrderStatus(order.user.email, {
                    id: x, status: 'Заявка отклонена'
                })
            } 
        })
    } catch(e) {
        log.error(e)
    }
}

this.start = async () => {
    try {
        const preset = await getPreset()
    
        const orders = await Order
            .find({ status: 0 })
            .exec()
    
        for (let order of orders) {
            const dismiss = async x => {
                const order = await Order
                    .findOne({ _id: x })
                    .populate('user')
                    .exec()

                if (order.status == 0) {
                    await Order.update({ _id: x }, {
                        status: 4
                    })

                    mailer.notifyCustomerOrderStatus(order.user.email, {
                        id: x, status: 'Заявка отклонена'
                    })
                } 
            }

            const deadLine = moment(order.date)
                .add(preset.orderLifetime, 'minutes')

            if (new Date() > deadLine.toDate()) {
                dismiss(order.id)
            } else {
                schedule.scheduleJob(deadLine.toDate(), () => {
                    dismiss(order.id)
                })
            }
        }
    } catch(e) {
        log.error(e)
    }
}

module.exports = this