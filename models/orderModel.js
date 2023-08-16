const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    items: [
        {
            menuId: mongoose.Schema.Types.ObjectId,
            quantity: Number
        }
    ],
    customer: {
        name: String,
        phoneNumber: String,
        address: String
    }
})

const Order = mongoose.model('Order', orderSchema)

module.exports = Order
