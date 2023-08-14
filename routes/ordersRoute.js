const express = require('express')
const router = express.Router()
const ordersController = require('../controllers/ordersController')

router.get('/', ordersController.fetchOrders)

module.exports = router
