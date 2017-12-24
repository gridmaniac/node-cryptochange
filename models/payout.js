const mongoose = require('mongoose'),
      Schema = mongoose.Schema

const schema = new Schema({
    user: {
        type: Number,
        ref: 'User',
        required: true
    },
    sum: {
        type: Number,
        required: true,
        default: 0
    },
    destination: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        required: true,
        default: 0
    }
})

const ai = require('mongoose-auto-increment')
schema.plugin(ai.plugin, 'Payout')

module.exports = mongoose.model('Payout', schema)