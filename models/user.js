const mongoose = require('mongoose')
      Schema = mongoose.Schema

let schema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    inflow: {
        type: Number,
        required: true,
        default: 0  
    },
    followers: {
        type: Number,
        required: true,
        default: 0
    },
    accrual: {
        type: Number,
        required: true,
        default: 0
    },
    referrer: {
        type: Number,
        ref: 'User'
    },
    role: {
        type: Boolean,
        required: true,
        default: false
    },
    ip: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        default: Date.now
    }
})

const bcrypt = require('bcrypt-nodejs')
schema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
}

schema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password)
}

const ai = require('mongoose-auto-increment')
schema.plugin(ai.plugin, { model: 'Order', startAt: '145261' })

module.exports = mongoose.model('User', schema)