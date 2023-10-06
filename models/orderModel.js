const mongoose = require('mongoose');
const UserInfo = require('./userInfoModel');

const orderSchema = new mongoose.Schema({
    items: [
        {
            menuId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Menu'
            },
            quantity: Number,
            price:Number
        }
    ],
    chatId: String, // افزودن فیلد chatId به مدل order
    userInfo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserInfo'
    }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
