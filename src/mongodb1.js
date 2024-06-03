const validator = require('validator');
const mongoose=require("mongoose");

mongoose.connect("mongodb://localhost:27017/phonebook")
.then(()=>{
    console.log('mongoose connected');
})
.catch((e)=>{
    console.log('failed');
})

const createSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: 'Email address is required',
        validate: {
            validator: validator.isEmail,
            message: 'Please fill a valid email address'
        },
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    number:{
        type:String,
    },
});


const createCollection=new mongoose.model('createCollection',createSchema)
module.exports=createCollection