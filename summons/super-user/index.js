const log = summon('log')(module)

const User = model('user')

this.make = async (credentials) => {
    try {
        const count = await User.count({ role: true })
        if (count === 0) {
            const user = new User()
            
            user.email = credentials.email
            user.password = 
                user.generateHash(credentials.pass)
            user.role = true
            
            await user.save()
        }
    } catch(e) {
        log.error(e)
    }
}