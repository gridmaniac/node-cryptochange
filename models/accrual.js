const mongoose = require('mongoose'),
      Schema = mongoose.Schema

const schema = new Schema({
    user: {
        type: Number,
        ref: 'User',
        required: true
    },
    originator: {
        type: String
    },
    sum: {
        type: Number,
        required: true,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    },
    type: {
        type: Number,
        required: true,
        default: 0
    },
    source: {
        type: Number,
        required: true
    }
})

const ai = require('mongoose-auto-increment')
schema.plugin(ai.plugin, { model: 'Accrual' })

module.exports = mongoose.model('Accrual', schema)