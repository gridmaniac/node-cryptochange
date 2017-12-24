const mongoose = require('mongoose'),
      Schema = mongoose.Schema

const schema = new Schema({
    title: {
        type: String,
        default: 'Новая страница'
    },
    description: {
        type: String
    },
    path: {
        type: String,
        default: 'new-page'
    },
    content: {
        type: String,
        default: ''
    },
    param: {
        type: String,
        default: ''
    },
    active: {
        type: Boolean,
        required: true,
        default: false
    },
    tag: {
        type: String
    }
})

const ai = require('mongoose-auto-increment')
schema.plugin(ai.plugin, 'Page')

module.exports = mongoose.model('Page', schema)