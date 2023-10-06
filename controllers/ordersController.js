const Order = require('../models/orderModel')
const UserInfo = require('../models/userInfoModel')

const fetchOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate({ path: 'items.menuId', select: 'itemName' })

        // بازیابی اطلاعات مرتبط با کاربر برای هر سفارش
        for (const order of orders) {
            const userInfo = await UserInfo.findOne({ _id: order.userInfo._id })
            order.userInfo = userInfo // اضافه کردن اطلاعات مرتبط با کاربر به هر سفارش
        }

        res.render('orders', { orders })

    } catch (error) {
        console.error('Error fetching orders:', error)
        res.status(500).json({ error: 'An error occurred while fetching orders.' })
    }
}

module.exports = {
    fetchOrders
}
