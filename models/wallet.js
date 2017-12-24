const mongoose = require('mongoose'),
      Schema = mongoose.Schema

const schema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    alias: {
        type: String,
        required: true,
        trim: true
    },
    icon: {
        type: String,
        default: 'empty.png'
    },
    code: {
        type: String,
        required: true,
        trim: true
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    verification: {
        type: Boolean,
        required: true,
        default: false
    },
    embedded: {
        type: String
    },
    requisites: {
        type: [{ type: Number, ref: 'Requisite' }]
    },
    minimum: {
        type: Number,
        required: true,
        default: 0
    },
    maximum: {
        type: Number,
        required: true,
        default: 999999999
    },
    fee: {
        type: Number,
        required: true,
        default: 0
    },
    fixto: {
        type: Number,
        required: true,
        default: 10
    },
    active: {
        type: Boolean,
        required: true,
        default: false
    },
    sort: {
        type: Number,
        required: true,
        default: 0
    },
    paybutton: {
        type: Boolean,
        required: true,
        default: true
    },
    evimark: {
        type: String
    },
    hashplate: {
        type: String
    }
})

const ai = require('mongoose-auto-increment')
schema.plugin(ai.plugin, 'Wallet')

module.exports = mongoose.model('Wallet', schema)