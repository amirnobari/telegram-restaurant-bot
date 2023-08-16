const TelegramBot = require('node-telegram-bot-api')
const Order = require('../models/orderModel')
const Menu = require('../models/menuModel')
require('dotenv').config()

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })

const steps = {}

//تنظیمات بات که یم ماژول شده
const setupBot = () => {
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id
        const firstName = msg.from.first_name

        bot.sendMessage(chatId, `Welcome, ${firstName}! Please choose items from the menu:`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Menu', callback_data: 'menu' }]
                ]
            }
        })

        // ذخیره مرحله انتخاب غذاها
        steps[chatId] = {
            step: 'chooseItems',
            order: {
                chatId: chatId,
                items: []
            }
        }
    })

    // ...
    bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id
        const option = query.data

        if (option === 'menu') {
            try {
                const menuItems = await Menu.find({})
                if (menuItems.length === 0) {
                    bot.sendMessage(chatId, 'There are no items available in the menu.')
                } else {
                    const orderData = steps[chatId].order

                    let menuMessage = 'Please choose items from the menu:\n'
                    menuItems.forEach((item, index) => {
                        menuMessage += `${index + 1} - ${item.itemName} - ${item.price} $ \n`

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

                // به روز رسانی دکمه‌ها برای نمایش تعداد انتخاب شده
                const updatedKeyboard = currentStep.order.items.map((item, index) => {
                    return [{ text: `${item.quantity}x ${item.name}`, callback_data: `add_${index}` }]
                })

                updatedKeyboard.push([{ text: 'Confirm Order', callback_data: 'confirm' }])

                bot.sendMessage(chatId, 'You have added an item to your order.', {
                    reply_markup: {
                        inline_keyboard: updatedKeyboard
                    }
                })

                // ذخیره اطلاعات سفارش به روز شده
                steps[chatId] = currentStep
            }
        } else if (option === 'confirm') {
            const currentStep = steps[chatId]

            if (currentStep && currentStep.step === 'chooseItems') {
                const totalItems = currentStep.order.items.reduce((total, item) => total + item.quantity, 0)

                if (totalItems === 0) {
                    bot.sendMessage(chatId, 'Your order basket is empty. Please choose items before confirming.')
                } else {
                    const orderTotal = currentStep.order.items.reduce((total, item) => {
                        return total + item.price * item.quantity
                    }, 0)

                    bot.sendMessage(chatId, `Your order total is: $ ${orderTotal} . Please confirm your order by pressing the "Confirm" button below.`, {
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'Confirm Order', callback_data: 'place_order' }],
                                [{ text: 'Cancel', callback_data: 'cancel_order' }]
                            ]
                        }
                    })

                    // ذخیره مرحله انتخاب نهایی سفارش
                    currentStep.step = 'confirmOrder'
                    steps[chatId] = currentStep
                }
            }
        } else if (option === 'place_order') {
            const currentStep = steps[chatId]

            if (currentStep && currentStep.step === 'confirmOrder') {
                currentStep.order.customer = {} // ایجاد متغیر customer

                bot.sendMessage(chatId, 'Please enter your phone number:', {
                    reply_markup: {
                        force_reply: true
                    }
                })

                // تغییر مرحله به انتظار دریافت شماره تلفن
                currentStep.step = 'waitForPhoneNumber'
                steps[chatId] = currentStep
            }
        }
        else if (option === 'provide_address') { // اضافه کردن این قسمت
            const currentStep = steps[chatId]

            if (currentStep && currentStep.step === 'waitForPhoneNumber') {
                bot.sendMessage(chatId, 'Please provide your address:', {
                    reply_markup: {
                        force_reply: true
                    }
                })

                // تغییر مرحله به انتظار دریافت آدرس
                currentStep.step = 'waitForAddress'
                steps[chatId] = currentStep
            }
        }
        else if (option === 'cancel_order') {
            // حذف مرحله سفارش کنونی از متغیر مراحل
            delete steps[chatId]

            // رفتن به مرحله انتخاب غذاها
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
                        menuMessage += `${index + 1} - ${item.itemName} - ${item.price} $ \n`

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

    })

    // ...

    bot.on('text', async (msg) => {
        const chatId = msg.chat.id
        const text = msg.text

        const currentStep = steps[chatId]

        if (currentStep && currentStep.step === 'waitForPhoneNumber') {
            const phoneNumber = text

            try {
                // ذخیره شماره تلفن در سفارش
                currentStep.order.customer.phoneNumber = phoneNumber

                // ارسال پیام و افزودن گزینه دریافت آدرس به منو
                bot.sendMessage(chatId, 'Phone number saved. Please provide your address:', {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Provide Address', callback_data: 'provide_address' }]
                        ]
                    }
                })

                // تغییر مرحله به انتظار دریافت آدرس
                currentStep.step = 'waitForAddress'
                steps[chatId] = currentStep
            } catch (error) {
                console.error('Error saving phone number:', error)
                bot.sendMessage(chatId, 'An error occurred while saving your phone number.')
            }
        } else if (currentStep && currentStep.step === 'waitForAddress') {
            const address = text

            try {
                // ذخیره آدرس در سفارش
                currentStep.order.customer.address = address

                // ذخیره سفارش در دیتابیس
                const newOrder = new Order({
                    items: currentStep.order.items.map(item => {
                        return {
                            menuId: item.menuId,
                            quantity: item.quantity
                        }
                    }),
                    customer: {
                        name: msg.from.username,
                        phoneNumber: currentStep.order.customer.phoneNumber,
                        address: address
                    }
                })

                const savedOrder = await newOrder.save()
                console.log('Order saved:', savedOrder)

                bot.sendMessage(chatId, 'Your order has been placed and saved. Thank you!')

                // حذف مرحله از متغیر مراحل
                delete steps[chatId]
            } catch (error) {
                console.error('Error saving order:', error)
                bot.sendMessage(chatId, 'An error occurred while saving your order.')
            }
        }
    })

    // ...

}
module.exports = {
    setupBot
}
