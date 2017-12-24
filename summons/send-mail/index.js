const mailer = require('pug-mailer')

mailer.init({
    service: 'Gmail',
    auth: {
        user: 'cchangetest@gmail.com',
        pass: '9223615Kei'
    }
})

this.notifyRegistration = (email, password) => {
    mailer.send({
        from: 'support@cryptochange.com',
        to: email,
        subject: 'Регистрация на сайте CryptoChange.com',
        template: 'registration',
        data: {
            email: email,
            password: password
        }
    })
}

this.notifyForgot = (email, password) => {
    mailer.send({
        from: 'support@cryptochange.com',
        to: email,
        subject: 'Восстановление пароля на сайте CryptoChange.com',
        template: 'forgot',
        data: {
            email: email,
            password: password
        }
    })
}

this.notifyCustomerOrder = (email, details) => {
    mailer.send({
        from: 'support@cryptochange.com',
        to: email,
        subject: 'Вы создали заявку на сайте CryptoChange.com',
        template: 'customer-order',
        data: details
    })
}

this.notifyCustomerOrderStatus = (email, details) => {
    mailer.send({
        from: 'support@cryptochange.com',
        to: email,
        subject: 'Обновлен статус заявки на сайте CryptoChange.com',
        template: 'customer-order-status',
        data: details
    })
}

this.notifyOperatorsOrder = (operators, details) => {
    for (var operator of operators) {
        mailer.send({
            from: 'support@cryptochange.com',
            to: operator.email,
            subject: 'Новая заявка на сайте CryptoChange.com',
            template: 'operator-order',
            data: details
        })
    }
}

this.notifyOperatorsDocument = (operators, details) => {
    for (var operator of operators) {
        mailer.send({
            from: 'support@cryptochange.com',
            to: operator.email,
            subject: 'Требуется подтверждение платежного средства на сайте CryptoChange.com',
            template: 'operator-document',
            data: details
        })
    }
}

this.notifyOperatorPayout = (email, details) => {
    mailer.send({
        from: 'support@cryptochange.com',
        to: email,
        subject: 'Поступил запрос на партнерскую выплату на сайте CryptoChange.com',
        template: 'operator-payout',
        data: details
    })
}

this.notifyCustomerPayout = (email, details) => {
    mailer.send({
        from: 'support@cryptochange.com',
        to: email,
        subject: 'Обновлен статус партнерской выплаты на сайте CryptoChange.com',
        template: 'customer-payout',
        data: details
    })
}

module.exports = this