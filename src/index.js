const http = require('http')//base class http that handle the communication using http protocole
const path = require('path')// base class path that handle all the operation on a directory path (absolute or relative)
const express = require('express')// express web server
const socketio = require('socket.io')// base class socket.io that handle communication using websocket
const Filtre = require('bad-words')// filtre message that contains bad word
//require messages.js to initiate the generateMessage generateLocationMessage to get json object  as a return data type
const {generateMessage,generateLocationMessage} = require('./utils/messages')
//require users.js to initiate the addUser,removeUser,getUser,getUsersInRoom to handle defferent operation in a user
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users')
//refactoring
const app = express() // initialize http express server
const server = http.createServer(app)//setup the express server in the http server configuration
const io = socketio(server)//run the socket.io within the same http server instance


const port = process.env.PORT || 3000 
// set the static file directory
const publicDirectoryPath = path.join(__dirname,'../public/')

//using use methode to configure the middleware used by the routes of the Express HTTP server object
//set the static file path "publicDirectoryPath" in express.static methode in the middelware to enable using static file
app.use(express.static(publicDirectoryPath))

const message ="Welcome!"

//add connection event listener to get fired when a user connect to the chat room
io.on('connection',(socket) => {
//add sendMessage event listener to be invoked from client-side 
// this event send message from user to another in the same room
socket.on('sendMessage',(message,callback) => {
    const user = getUser(socket.id)

    const filtre = new Filtre()
    if(filtre.isProfane(message)) {
        return callback('Profanity is not allowed')
    } 
    io.to(user.room).emit('message',generateMessage(message , user.username))
    callback()
})

// add join event listener to be invoked from client-side
// this event will be invoked after user submit the registration form
// it will add the user credentials and the room name to users list
socket.on('join',({username , room},callback) => {
    const {error , user} = addUser({id:socket.id,username,room})
  if(error)
  {
   return callback(error)
  }

    // join a room with unique name (the room name wil be the is of the room)
    socket.join(user.room)

    //invoke message event from back to front to send welcome to the authenticated user
    socket.emit('message',generateMessage(message, user.username))
    // broadcast a message to all the user connected to the room except the user session
    socket.broadcast.to(user.room).emit('message',generateMessage(`${user.username} has joined!`, user.username))
    //invoke roomData event to send the list of users connected to a room to the client side
    io.to(user.room).emit('roomData', {
        room:user.room,
        users : getUsersInRoom(user.room)
    })
   callback()

})

// add sendLocation event to be fired from client side to request for location url
socket.on('sendLocation',(coords,callback) => {
    console.log(coords)
    const user = getUser(socket.id)
    console.log(user)
    const url = `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
    //invoke locationMessage event from server side to client side to send the location url and the username
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