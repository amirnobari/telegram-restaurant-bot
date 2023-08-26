const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const path = require('path')
const ejs = require('ejs')
const botController = require('./controllers/botController')
const menuRoute = require('./routes/menuRoute') // اضافه کردن مسیر منو
const ordersRouter = require('./routes/ordersRoute')
const foodSensitivityRoute = require('./routes/foodSensitivityRoute') // مسیر به فایل foodSensitivityRoute.js

require('dotenv').config() 

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());


app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')


mongoose.connect('mongodb://127.0.0.1/restaurant', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB')
}).catch(err => {
    console.error('Error connecting to MongoDB:', err)
})

app.use('/orders', ordersRouter)
app.use('/menus', menuRoute) // اضافه کردن مسیر منو
app.use('/foodSensitivity', foodSensitivityRoute) // استفاده از روت‌های foodSensitivity

botController.setupBot()

const PORT = process.env.APP_PORT || 5555 // Use 5555 as default if APP_PORT is not set in .env

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
