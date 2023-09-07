
const TelegramBot = require('node-telegram-bot-api')
const Order = require('../models/orderModel')
const Menu = require('../models/menuModel')
const UserInfo = require('../models/userInfoModel')
require('dotenv').config()
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })
const steps = {}
//تنظیمات بات که یم ماژول شده
const setupBot = () => {
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id
        const firstName = msg.from.first_name
        const lasttName = msg.from.last_name

        // ذخیره مرحله انتخاب شماره تلفن و آدرس
        steps[chatId] = {
            step: 'waitForPhoneNumber',
            order: {
                chatId: chatId,
                items: []
            }
        }

        bot.sendMessage(chatId, ` Welcome, ${firstName} ${lasttName}! ⚠️ Please provide your phone number (Example: +98910000000):`, {
            reply_markup: {
                force_reply: true
            }
        })
    })
    // الگوی اعتبارسنجی شماره تلفن (مثال: +989123456789)
    const phonePattern = /^\+?[0-9]{12}$/ // تغییر الگو به 12 عدد برای مطابقت با "+989" و 9 رقم پیش‌شماره ایران
    bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id
        const option = query.data
        if (steps[chatId]) {
            // const currentStep = steps[chatId]
            if (option === 'menu') {
                try {
                    const menuItems = await Menu.find({})
                    if (menuItems.length === 0) {
                        bot.sendMessage(chatId, 'There are no items available in the menu.')
                    } else {
                        const orderData = steps[chatId].order

                        let menuMessage = 'Please choose items from the menu:\n'
                        menuItems.forEach((item, index) => {
                            menuMessage += `${index + 1} - ${item.itemName} - ${item.price} 💲 \n`

                            orderData.items.push({
                                menuId: item._id,
                                name: item.itemName,
                                price: item.price,
                                quantity: 0
                            })
                        })

                        bot.sendMessage(chatId, menuMessage, {
                            reply_markup: {
                                inline_keyboard: [
                                    ...menuItems.map((item, index) => {
                                        return [{ text: `+ ${item.itemName}`, callback_data: `add_${index}` }]
                                    }),
                                    [{ text: 'Confirm Order', callback_data: 'confirm' }]
                                ]
                            }
                        })
                        steps[chatId].step = 'chooseItems'
                    }
                } catch (error) {
                    console.error('Error fetching menu:', error)
                    bot.sendMessage(chatId, 'An error occurred while fetching the menu.')
                }


            } else if (option.startsWith('add_')) {
                const itemIndex = parseInt(option.split('_')[1])
                const currentStep = steps[chatId]

                if (currentStep && currentStep.step === 'chooseItems') {
                    const selectedMenuItem = currentStep.order.items[itemIndex]
                    selectedMenuItem.quantity += 1
                    console.log(selectedMenuItem)
                    // به روز رسانی دکمه‌ها برای نمایش تعداد انتخاب شده
                    const updatedKeyboard = currentStep.order.items.map((item, index) => {
                        return [{ text: `${item.quantity}x ${item.name}`, callback_data: `add_${index}` }]
                    })

                    updatedKeyboard.push([{ text: 'Confirm Order', callback_data: 'confirm' }])

                    bot.sendMessage(chatId, '🎉 You have added an item to your order 🎉.', {
                        reply_markup: {
                            inline_keyboard: updatedKeyboard
                        }
                    })

                    // ذخیره اطلاعات سفارش به روز شده
                    steps[chatId] = currentStep
                }
            } else if (option === 'confirm') {
                const currentStep = steps[chatId]
                //  console.log(currentStep)
                if (currentStep && currentStep.step === 'chooseItems') {
                    const totalItems = currentStep.order.items.reduce((total, item) => total + item.quantity, 0)
                    //  console.log(totalItems)

                    if (totalItems === 0) {
                        bot.sendMessage(chatId, '⛔ Your order basket is empty. Please choose items before confirming ⛔.')
                    } else {
                        const orderTotal = currentStep.order.items.reduce((total, item) => {
                            return total + item.price * item.quantity
                        }, 0)
                        // console.log(orderTotal)
                        bot.sendMessage(chatId, `Your order total is: 💲 ${orderTotal} . Please confirm your order by pressing the "Confirm" button below.`, {
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: 'Place Order', callback_data: 'place_order' }],
                                    [{ text: 'Cancel', callback_data: 'cancel_order' }]
                                ]
                            }
                        })

                        // Update the step to 'confirmOrder' and save the changes
                        currentStep.step = 'confirmOrder'
                        steps[chatId] = currentStep // Save the changes back to the steps object
                    }
                }
            } else if (option === 'place_order') {
                const currentStep = steps[chatId]
                //console.log(currentStep);
                if (currentStep && currentStep.step === 'confirmOrder') {
                    currentStep.order.customer = {}
                    if (currentStep.order.customer) {
                        const orderItems = currentStep.order.items.filter(item => item.quantity > 0) // حذف آیتم‌هایی که تعدادشان 0 است
                        if (orderItems.length > 0) {
                            // Create a new instance of the Order model
                            const order = new Order({
                                items: orderItems,
                            })

                            try {

                                // Save the order to the database
                                await order.save()

                                // Inform the user that the order has been placed
                                bot.sendMessage(chatId, '🎉 Your order has been placed successfully 🎉.')

                                // Clean up the steps object
                                delete steps[chatId]
                            } catch (error) {
                                console.error('Error saving order:', error)
                                bot.sendMessage(chatId, 'An error occurred while placing your order.')
                            }
                        } else {
                            bot.sendMessage(chatId, 'Your order basket is empty. Please choose items before confirming 🙏.')
                        }
                    }

                }
            }

        }
    })
    bot.on('text', async (msg) => {
        const chatId = msg.chat.id
        const text = msg.text
        const currentStep = steps[chatId]

        if (currentStep) {
            if (currentStep.step === 'waitForPhoneNumber') {
                const phoneNumber = text
                if (phonePattern.test(phoneNumber)) {
                    currentStep.userInfo = new UserInfo({
                        phoneNumber: phoneNumber,
                        address: '',
                        username: msg.from.first_name
                    })
                    await currentStep.userInfo.save()

                    bot.sendMessage(chatId, 'Phone number saved 👌. Please provide your address:', {
                        reply_markup: {
                            force_reply: true
                        }
                    })
                    currentStep.step = 'waitForAddress'
                    steps[chatId] = currentStep
                } else {
                    bot.sendMessage(chatId, '⛔ Invalid phone number. Please provide a valid phone number ⛔.')
                }
            } else if (currentStep.step === 'waitForAddress') {
                const address = text
                //console.log(address)

                try {
                    currentStep.userInfo.address = address
                    await currentStep.userInfo.save()
                    bot.sendMessage(chatId, 'Address saved successfully 👌')
                    bot.sendMessage(chatId, '⚠️ For information about food allergies, call this number : 09367482353 ⚠️')
                    delete steps[chatId] // Clear the steps for this chat
                } catch (error) {
                    console.error('Error saving address:', error)
                    bot.sendMessage(chatId, 'An error occurred while saving your address.')
                }


                try {
                    const menuItems = await Menu.find({})
                    if (menuItems.length === 0) {
                        bot.sendMessage(chatId, 'There are no items available in the menu.')
                    } else {
                        const orderData = {
                            chatId: chatId,
                            items: []
                        }
                        let menuMessage = 'Please choose items from the menu:\n'
                        menuItems.forEach((item, index) => {
                            menuMessage += `${index + 1} - ${item.itemName} - ${item.price} 💲 \n`
                            orderData.items.push({
                                menuId: item._id,
                                name: item.itemName,
                                price: item.price,
                                quantity: 0
                            })
                        })
                        bot.sendMessage(chatId, menuMessage, {
                            reply_markup: {
                                inline_keyboard: [
                                    ...menuItems.map((item, index) => {
                                        return [{ text: `+ ${item.itemName}`, callback_data: `add_${index}` }]
                                    }),
                                    [{ text: 'Confirm Order', callback_data: 'confirm' }]
                                ]
                            }
                        })
                        steps[chatId] = {
                            step: 'chooseItems',
                            order: orderData
                        }
                    }
                } catch (error) {
                    console.error('Error fetching menu:', error)
                    bot.sendMessage(chatId, 'An error occurred while fetching the menu.')
                }
            }
        }
    })
}
module.exports = {
    setupBot
}