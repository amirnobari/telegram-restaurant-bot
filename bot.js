const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const path = require('path')
const ejs = require('ejs')
const app = express()
const botController = require('./controllers/botController')
const menuRoute = require('./routes/menuRoute') // اضافه کردن مسیر منو


require('dotenv').config()

app.use(bodyParser.json())
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

const ordersRouter = require('./routes/ordersRoute')

mongoose.connect(`mongodb://${process.env.MONGO_HOSTNAME}:${process.env.MONGO_PORT}/${process.env.MONGO_DB_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB')
}).catch(err => {
    console.error('Error connecting to MongoDB:', err)
})

app.use('/orders', ordersRouter)
app.use('/menus', menuRoute) // اضافه کردن مسیر منو


botController.setupBot()

const PORT = process.env.APP_PORT || 5555 // Use 5555 as default if APP_PORT is not set in .env

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
