const Order = require('../models/orderModel')
const Menu = require('../models/menuModel')

const fetchOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate('items.menuId', 'itemName')
        const menuItems = await Menu.find({})
        res.render('orders', { orders, menuItems })
    } catch (error) {
        console.error('Error fetching orders:', error)
        res.status(500).json({ error: 'An error occurred while fetching orders.' })
    }
}

module.exports = {
    fetchOrders
}
