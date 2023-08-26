const express = require('express')
const router = express.Router()
const FoodSensitivityController = require('../controllers/foodSensitivityController')

// روت نمایش فرم اضافه کردن حساسیت غذایی
router.get('/add', FoodSensitivityController.showAddForm)

// روت اضافه کردن حساسیت غذایی
router.post('/add', FoodSensitivityController.addFoodSensitivity)

module.exports = router
