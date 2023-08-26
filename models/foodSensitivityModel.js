const mongoose = require('mongoose')

const foodSensitivitySchema = new mongoose.Schema({
    foodName: String,
    sensitivities: [String] // مثلاً: ['gluten', 'lactose', 'nuts']
})

const FoodSensitivity = mongoose.model('FoodSensitivity', foodSensitivitySchema)

module.exports = FoodSensitivity
