const FoodSensitivity = require('../models/foodSensitivityModel');
const bot = require('./botController')

exports.showList = async (bot, chatId) => {
    try {
        const sensitivities = await FoodSensitivity.find()
        let message = 'List of food sensitivities:\n\n'
        sensitivities.forEach((sensitivity, index) => {
            message += `${index + 1}. ${sensitivity.foodName} - ${sensitivity.sensitivities.join(', ')}\n`
        })
        bot.sendMessage(chatId, message)
    } catch (error) {
        console.error('Error fetching food sensitivities:', error)
        bot.sendMessage(chatId, 'An error occurred while fetching food sensitivities.')
    }
}
