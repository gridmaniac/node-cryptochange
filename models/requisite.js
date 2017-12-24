const mongoose = require('mongoose'),
      Schema = mongoose.Schema

const schema = new Schema({
    title: {
        type: String,
        required: true
    },
    placeholder: {
        type: String
    },
    validator: {
        type: String
    },
    alias: {
        type: String,
        required: true
    },
    message: {
        type: String
    }
})

const ai = require('mongoose-auto-increment')
schema.plugin(ai.plugin, 'Requisite')

module.exports = mongoose.model('Requisite', schema)