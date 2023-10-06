const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const path = require('path')
const botController = require('./controllers/botController')
const menuRoute = require('./routes/menuRoute') // اضافه کردن مسیر منو
const ordersRouter = require('./routes/ordersRoute')

require('dotenv').config()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())


app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')


mongoose.connect(`mongodb://${process.env.MONGO_HOSTNAME}:${process.env.MONGO_PORT}/${process.env.MONGO_INITDB_DATABASE}`, {
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
