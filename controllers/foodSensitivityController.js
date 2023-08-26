const FoodSensitivity = require('../models/foodSensitivityModel')

// نمایش فرم اضافه کردن حساسیت غذایی
exports.showAddForm = (req, res) => {
    res.render('addFoodSensitivity')
}

// اضافه کردن حساسیت غذایی
exports.addFoodSensitivity = async (req, res) => {
    try {
        const { foodName, sensitivities } = req.body
        const sensitivityArray = sensitivities.split(',').map(sensitivity => sensitivity.trim())

        const newFoodSensitivity = new FoodSensitivity({
            foodName: foodName,
            sensitivities: sensitivityArray
        })

        await newFoodSensitivity.save()
        res.redirect('/foodSensitivity/add') // Redirect back to the form
    } catch (error) {
        console.error('Error adding food sensitivity:', error)
        res.status(500).send('An error occurred while adding food sensitivity.')
    }
}
