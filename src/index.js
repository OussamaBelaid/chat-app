const http = require('http')
const path = require('path')
const express = require('express')
const socketio = require('socket.io')
const Filtre = require('bad-words')
const {generateMessage,generateLocationMessage} = require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users')
//refactoring
const app = express()
const server = http.createServer(app)
const io = socketio(server)


const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public/')


app.use(express.static(publicDirectoryPath))
let count = 0
const message ="Welcome!"



io.on('connection',(socket) => {
console.log(`new web socket connection ${socket.id}`)






socket.on('sendMessage',(message,callback) => {
    const user = getUser(socket.id)

    const filtre = new Filtre()
    if(filtre.isProfane(message)) {
        return callback('Profanity is not allowed')
    } 
    io.to(user.room).emit('message',generateMessage(message , user.username))
    callback()
})


socket.on('join',({username , room},callback) => {
    const {error , user} = addUser({id:socket.id,username,room})
  if(error)
  {
   return callback(error)
  }


    socket.join(user.room)

    socket.emit('message',generateMessage(message, user.username))
    socket.broadcast.to(user.room).emit('message',generateMessage(`${user.username} has joined!`, user.username))
    io.to(user.room).emit('roomData', {
        room:user.room,
        users : getUsersInRoom(user.room)
    })
   callback()

})

socket.on('roomData',({room,users}) => {
  console.log(room)
  console.log(users)
})
socket.on('sendLocation',(coords,callback) => {
    console.log(coords)
    const user = getUser(socket.id)
    console.log(user)
    const url = `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
  io.to(user.room).emit('locationMessage',generateLocationMessage(url,user.username))
  callback()
})

socket.on('disconnect',() => {
  const user = removeUser(socket.id)

  if(user)
  {
    io.to(user.room).emit('message',generateMessage(`${user.username} has left!`))
    io.to(user.room).emit('roomData', {
        room : user.room,
        users : getUsersInRoom(user.room)
    })
  }
    
})
})



server.listen(port,() => {
    console.log(`server runnig on port ${port}`)
})