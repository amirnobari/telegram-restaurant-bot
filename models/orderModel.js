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
        address: String,
        telegramPhoneNumber: String // اضافه کردن شماره تلفن تلگرامی

    }
})

const Order = mongoose.model('Order', orderSchema)

module.exports = Order
