const User = model('user')

module.exports = async x => {
    const user = 
        await User.findOne({ _id: x })

    user.followers ++
    await user.save()
}