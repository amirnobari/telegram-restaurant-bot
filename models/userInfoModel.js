const mongoose = require('mongoose')

const userInfoSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    phoneNumber: String,
    address: String
   
})

const UserInfo = mongoose.model('UserInfo', userInfoSchema)

module.exports = UserInfo
