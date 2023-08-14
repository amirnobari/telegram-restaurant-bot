const mongoose = require('mongoose')

const menuSchema = new mongoose.Schema({
    itemName: String,
    category: String,
    price: Number
})

const Menu = mongoose.model('Menu', menuSchema)

module.exports = Menu
