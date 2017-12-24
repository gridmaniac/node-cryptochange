const Router = require('koa-router'),
      router = new Router(),
      views = 'app/views/'

const log = summon('log')(module),
      rates = summon('rates'),
      getDiscount = summon('discount'),
      isEmail = summon('is-email'),
      generator = require('generate-password'),
      getWithheld = summon('withheld'),
      mailer = summon('send-mail'),
      validateRequisites = summon('validate-requisites'),
      statistic = summon('statistic')

const Wallet = model('wallet'),
      Order = model('order'),
      User = model('user'),
      UserRequisite = model('user-requisite')

router.post('/', async (ctx, next) => {
    try {
        const data = JSON.parse(ctx.request.body.data)

        if (!data.osum)
            return ctx.body = { err: 'Не указана сумма обмена' }

        const [ origin, target ] = [
            await Wallet
                .findOne({ alias: data.origin })
                .populate('requisites')
                .exec(),
            await Wallet
                .findOne({ alias: data.target })
                .populate('requisites')
                .exec()
        ]

        data.osum = parseFloat(parseFloat(data.osum).toFixed(origin.fixto))

        if (data.osum < origin.minimum)
            return ctx.body = { 
                err: `Минимальная сумма обмена: ${origin.minimum} ${origin.code}`
            }

        if (data.osum > origin.maximum)
            return ctx.body = { 
                err: `Максимальная сумма обмена: ${origin.maximum} ${origin.code}`
            }

        let discount = 0
        if (ctx.isAuthenticated()) {
            const user = await User.findOne({ _id: ctx.state.user.id })
            discount = getDiscount(user.inflow)
        }

        const rawrates = rates(origin.code, target.code),
              fee = rawrates * (target.fee - discount) * 0.01,
              rerates = (rawrates - fee).toFixed(9)

        const tsum = (data.osum * rerates).toFixed(target.fixto)

        const withheld = await getWithheld(target.id).toString()
        if (tsum > withheld || tsum > target.balance)
            return ctx.body = { err: 'Получаемая сумма превышает резерв' }

        const o = validateRequisites(origin.requisites, data.originRequisites)
        if (!o.valid)
            return ctx.body = {
                err: o.err
            }

        const t = validateRequisites(target.requisites, data.targetRequisites)
        if (!t.valid)
            return ctx.body = {
                err: t.err
            }

        const orequisites = data.originRequisites,
              trequisites = data.targetRequisites

        let user = {}
        if (ctx.isAuthenticated()) {
            user = ctx.state.user.id
        } else {
            if (!data.email || !isEmail(data.email))
                return ctx.body = { err: 'Поле Email не заполнено или имеет неверный формат' }

            const count = await User.count({ email: data.email })
            if (count > 0)
                return ctx.body = { err: 'Данный Email уже используется. Если это ваш Email, то для начала осуществите вход' }

            const newUser = new User()

            newUser.email = data.email

            const pass = generator.generate({
                length: 10,
                numbers: true
            })

            newUser.password = newUser.generateHash(pass)

            if (ctx.session.ref) {
                newUser.referrer = ctx.session.ref
                statistic.snap('REF', 1)
            }

            await newUser.save()
            statistic.snap('REG', 1)

            if (ctx.request.ip) {
                await User
                    .update({ _id: newUser.id }, {
                        ip: ctx.request.ip
                    })
            }

            ctx.login(newUser)
            user = newUser.id
            mailer.notifyRegistration(data.email, pass)
        }

        const count = await Order
            .count({
                $and: [
                    { user},
                    { $or: [
                        { status: 0 },
                        { status: 1 },
                        { status: 2 }
                    ]}
                ]})
            .exec()

        if (count > 0) {
            return ctx.body = { err: 'Уже имеется одна активная заявка' }
        }

        let mOriginRequisite = await UserRequisite
            .findOne({ user, wallet: origin.id, values: orequisites })

        if (!mOriginRequisite && orequisites && orequisites.length > 0) {
            mOriginRequisite = new UserRequisite({
                user,
                wallet: origin.id,
                values: orequisites
            })
            await mOriginRequisite.save()
        }

        let mTargetRequisite = await UserRequisite
            .findOne({ user, wallet: target.id, values: trequisites })

        if (!mTargetRequisite && trequisites && trequisites.length > 0) {
            mTargetRequisite = new UserRequisite({
                user,
                wallet: target.id,
                values: trequisites
            })
            await mTargetRequisite.save()
        }

        const order = new Order({
            user,
            owallet: origin.id,
            twallet: target.id,
            orequisites,
            trequisites,
            osum: data.osum,
            tsum,
            rates: rerates,
            phase: mOriginRequisite ? mOriginRequisite.phase : 0,
            evidence: mOriginRequisite ? mOriginRequisite.evidence : ''
        })

        const { id } = await order.save()
        const orderKiller = summon('order-killer')
        await orderKiller.feed(id)

        mailer.notifyCustomerOrder(data.email, {
            id,
            origin: origin.title,
            osum: data.osum,
            ocode: origin.code,
            target: target.title,
            tsum,
            tcode: target.code
        })

        ctx.body = { id }
    } catch(e) {
        log.error(e)
        ctx.setState('e', e)
        next()
    }
})

module.exports = router