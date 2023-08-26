const express = require('express')
const router = express.Router()
const menuController = require('../controllers/menuController')

router.get('/edit', menuController.getEditMenuPage)
router.post('/edit', menuController.addMenuItem)

module.exports = router