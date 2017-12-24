const mongoose = require('mongoose'),
      Schema = mongoose.Schema

var schema = new Schema({
    user: {
        type: Number,
        ref: 'User',
        required: true
    },
    owallet: {
        type: Number,
        ref: 'Wallet',
        required: true
    },
    twallet: {
        type: Number,
        ref: 'Wallet',
        required: true
    },
    orequisites: {
        type: Array
    },
    trequisites: {
        type: Array
    },
    osum: {
        type: Number,
        required: true
    },
    tsum: {
        type: Number,
        required: true
    },
    rates: {
        type: Number,
        required: true
    },
    operator: {
        type: Number,
        ref: 'User'
    },
    status: {
        type: Number,
        required: true,
        default: 0
    },
    phase:  {
        type: Number,
        required: true,
        default: 0
    },
    evidence: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
})

const ai = require('mongoose-auto-increment')
schema.plugin(ai.plugin, { model: 'Order', startAt: '452613' })

module.exports = mongoose.model('Order', schema)