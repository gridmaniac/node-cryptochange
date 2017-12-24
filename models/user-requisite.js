const mongoose = require('mongoose'),
      Schema = mongoose.Schema

const schema = new Schema({
    user: {
        type: Number,
        ref: 'User',
        required: true
    },
    wallet: {
        type: Number,
        ref: 'Wallet',
        required: true
    },
    values: {
        type: Array,
        required: true
    },
    phase: {
        type: Number,
        required: true,
        default: 0
    },
    evidence: {
        type: String
    }
})

const ai = require('mongoose-auto-increment')
schema.plugin(ai.plugin, 'UserRequisite')

module.exports = mongoose.model('UserRequisite', schema)