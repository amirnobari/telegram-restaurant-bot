const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    items: [
        {
            menuId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Menu'
            },
            quantity: Number
        }
    ],
    userInfo: { // Add this field to link to UserInfo model
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserInfo'
    }
})

const Order = mongoose.model('Order', orderSchema)

module.exports = Order
