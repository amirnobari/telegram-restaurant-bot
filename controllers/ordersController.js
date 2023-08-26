const Order = require('../models/orderModel');
const fetchOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate([
            { path: 'items.menuId', select: 'itemName' },
            { path: 'userInfo', select: ['username', 'phoneNumber', 'address', 'orders'] }
        ])

        res.render('orders', { orders })
    } catch (error) {
        console.error('Error fetching orders:', error)
        res.status(500).json({ error: 'An error occurred while fetching orders.' })
    }
}

module.exports = {
    fetchOrders
}
