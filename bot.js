const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const path = require('path')
const ejs = require('ejs')
const botController = require('./controllers/botController')
botController.setupBot()
require('dotenv').config() // Import the dotenv library to read .env file

const app = express()
app.use(bodyParser.json())
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

const ordersRouter = require('./routes/ordersRoute')

mongoose.connect('mongodb://127.0.0.1/restaurant', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB')
}).catch(err => {
    console.error('Error connecting to MongoDB:', err)
})

app.use('/orders', ordersRouter)

botController.setupBot()

const PORT = process.env.APP_PORT || 5555 // Use 5555 as default if APP_PORT is not set in .env

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
