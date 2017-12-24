const mongoose = require('mongoose'),
      Schema = mongoose.Schema

const schema = new Schema({
    name: {
        type: String,
        required: true,
        uppercase: true
    },
    value: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
})

const ai = require('mongoose-auto-increment')
schema.plugin(ai.plugin, 'Statistic')

module.exports = mongoose.model('Statistic', schema)