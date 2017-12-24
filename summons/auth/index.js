const passport = require('koa-passport'),
      log = summon('log')(module),
      mailer = summon('send-mail'),
      statistic = summon('statistic')

this.apply = () => {
    const User = model('user')

    passport.serializeUser((user, done) => {
        done(null, user.id)
    })
    
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id)
            done(null, user)
        } catch(e) {
            log.error(e)
        }
    })
    
    const LocalStrategy = require('passport-local').Strategy
    
    passport.use('login', 
        new LocalStrategy({
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true 
        }, async (ctx, email, pass, done) => {
            try {
                const user = await User.findOne({ email })
                if (!user) {
                    ctx.flash('error', 'Пользователь с таким Email не найден')
                    return done(null, false)
                }

                if (!pass || !user.validPassword(pass)) {
                    ctx.flash('error', 'Пароль указан неверно')
                    return done(null, false)
                }

                if (ctx.ctx.ip) {
                    await User
                        .update({ _id: user.id }, {
                            ip: ctx.ctx.ip
                        })
                }

                return done(null, user)
            } catch(e) {
                log.error(e)
                return done(e)
            }
    }))

    passport.use('register', 
        new LocalStrategy({
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true 
        }, async (ctx, email, pass, done) => {
            try {
                const user = await User.findOne({ email })
                if (user) {
                    ctx.flash('error', 'Пользователь с таким Email уже зарегистрирован')
                    return done(null, false)
                }

                const newUser = new User()

                newUser.email = email
                newUser.password = newUser.generateHash(pass)

                if (ctx.session.ref) {
                    newUser.referrer = ctx.session.ref
                    statistic.snap('REF', 1)
                }

                await newUser.save()
                statistic.snap('REG', 1)

                if (ctx.ctx.ip) {
                    await User
                        .update({ _id: newUser.id }, {
                            ip: ctx.ctx.ip
                        })
                }

                mailer.notifyRegistration(email, pass)
                return done(null, newUser)
            } catch(e) {
                log.error(e)
                return done(e)
            }
    }))
}

this.isAuthenticated = (ctx, next) => {
    if (ctx.isAuthenticated())
        return next()
    ctx.redirect('/')
}

this.isUnauthenticated = (ctx, next) => {
    if (ctx.isUnauthenticated())
        return next()
    ctx.redirect('/')
}

this.isAdminAuthenticated = (ctx, next) => {
    if (ctx.isUnauthenticated())
        ctx.redirect('/admin/login')
    else if (!ctx.state.user.role)
        ctx.redirect('/')
    else return next()
}

this.isAdminUnauthenticated = (ctx, next) => {
    if (ctx.isAuthenticated())
        ctx.redirect('/admin')
    else return next()
}

module.exports = this