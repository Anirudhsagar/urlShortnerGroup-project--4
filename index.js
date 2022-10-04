const express=require("express")
const mongoose=require("mongoose")
const bodyParser=require("body-parser")

const route=require('./src/route/route')


const app = express()

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://muhaz:6VE8Lk82R6vAuBok@cluster0.syf7fzi.mongodb.net/group1database",{useNewUrlParser:true})
.then(()=>{
    console.log("MongoDB Connected..")
}).catch(err=>{
    console.log(err.message);
})

app.use('/',route)

app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3001))})