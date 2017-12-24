const mongoose = require('mongoose'),
      Schema = mongoose.Schema

const schema = new Schema({
    name: {
        type: String,
        required: true
    },
    minPayout: {
        type: String,
        default: 10
    },
    oxrKey: {
        type: String,
        default: 'e8d202e4f2f345c0ac5128ea7f46f7cc'
    },
    orderLifetime: {
        type: Number,
        default: 30
    },
    rates: {
        type: String,
        default: 'usdrub,eurrub,btcusd,btcrub,ltcusd,ltcrub,ethusd,ethrub'
    },
    defaultOrigin: {
        type: String,
        default: 'sberbank'
    },
    defaultTarget: {
        type: String,
        default: 'bitcoin'
    }
})

const ai = require('mongoose-auto-increment')
schema.plugin(ai.plugin, 'Preset')

module.exports = mongoose.model('Preset', schema)