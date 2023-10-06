
const TelegramBot = require('node-telegram-bot-api')
const Order = require('../models/orderModel')
const Menu = require('../models/menuModel')
const UserInfo = require('../models/userInfoModel')
require('dotenv').config()
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })
const steps = {}


// تعریف تابع sendMenu برای نمایش منو به کاربر
const sendMenu = async (chatId) => {
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
                // افزودن اطلاعات غذا به سفارش
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

const setupBot = () => {

    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id
        const firstName = msg.from.first_name
        const lasttName = msg.from.last_name
        const existingUser = await UserInfo.findOne({ chatId })

        if (existingUser) {
            bot.sendMessage(chatId, ` Welcome Back, ${firstName} ${lasttName}! 🙌`)
            // اگر کاربر قبلاً اطلاعات خود را وارد کرده باشد
            sendMenu(chatId) // نمایش منوی اصلی به کاربر
        } else {
            // اگر کاربر اطلاعات خود را وارد نکرده باشد
            // ذخیره کردن مرحله انتظار برای شماره تلفن و آدرس
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
        }
    })

    const phonePattern = /^\+?[0-9]{12}$/ // تغییر الگو به 12 عدد برای مطابقت با "+989" و 9 رقم پیش‌شماره ایران

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
                        firstname: msg.from.first_name,
                        lastname: msg.from.last_name,
                        chatId: chatId
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
                console.log(chatId)

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

                sendMenu(chatId)

            }
        }
    })
    bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id
        const option = query.data
        if (steps[chatId]) {
            // const currentStep = steps[chatId]
            if (option === 'menu') {
                sendMenu(chatId)


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

                    bot.sendMessage(chatId, '🎉 You have added an item to your order 🎉.', {
                        reply_markup: {
                            inline_keyboard: updatedKeyboard,
                        },
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
            }
            else if (option === 'cancel_order') {
                const currentStep = steps[chatId]
                if (currentStep) {
                    // اگر در مرحله تایید سفارش باشد، سبد خرید را پاک کنید
                    if (currentStep.step === 'confirmOrder') {
                        currentStep.order.items.forEach(item => {
                            item.quantity = 0 // تعداد همه آیتم‌ها را صفر کنید
                        })
                        bot.sendMessage(chatId, 'Your order has been canceled. You can choose items from the menu again.')
                    }

                    // حذف مراحل برای این چت
                    delete steps[chatId]
                }
                sendMenu(chatId)

            } else if (option === 'place_order') {
                const currentStep = steps[chatId]
                if (currentStep && currentStep.step === 'confirmOrder') {
                    // حذف غذاهایی که تعدادشان صفر است
                    currentStep.order.items = currentStep.order.items.filter(item => item.quantity > 0)

                    if (currentStep.order.items.length > 0) {
                        const userInfo = await UserInfo.findOne({ chatId: chatId }) // پیدا کردن userInfo با استفاده از chatId

                        if (userInfo) {
                            // افزودن سفارش به دیتابیس
                            const orderData = {
                                items: currentStep.order.items,
                                chatId: chatId,
                                userInfo: userInfo._id
                            }

                            try {
                                const order = new Order(orderData)
                                await order.save()
                                bot.sendMessage(chatId, '🎉 Your order has been placed successfully 🎉.')


                            } catch (error) {
                                console.error('Error saving order:', error)
                                bot.sendMessage(chatId, 'An error occurred while placing your order.')
                            }
                        }
                    }
                    else {
                        bot.sendMessage(chatId, 'Your order basket is empty. Please choose items before confirming 🙏.')
                    }
                }

            }

        }
    })
}

module.exports = {
    setupBot
}