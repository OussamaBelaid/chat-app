const socket = io()
//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sideBar = document.querySelector('#sidebar')
// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML
const sendLocation =  document.querySelector('#send-location')

//Options
//get the username and the room from the query string after submitting the form
const {username , room} = Qs.parse(location.search,{ignoreQueryPrefix : true})
//set scrolling configuration 
const autoScroll = () => {
    //New message element
  const $newMessage = $messages.lastElementChild

  // Height of the new message
   const newMessageStyles = getComputedStyle($newMessage)
   const newMessageMargin = parseInt(newMessageStyles.marginBottom)
   const newMessageHeight = $newMessage.offseHeight + newMessageMargin

   // visible height
   const visibleHeight = $messages.offseHeight

   //height of messages container

   const containerHeight = $messages.scrollHeight

     // how far have i scrolled ?
     const scrollOffset = $messages.scrollTop

     if(containerHeight - newMessageHeight <= scrollOffset){
       $messages.scrollTop = $messages.scrollHeight
     }

}
// set the message in the template
// handle the message invoked event from backend
socket.on('message',(message) => {
    
    const html = Mustache.render(messageTemplate,{
      message : message.text,
      createdAt : moment(message.createdAt).format("H:mm a"),
      username : message.username
    })
    console.log(message)
    $messages.insertAdjacentHTML('beforeend', html)
})

// set the location message in the template
// handle the locationMessage invoked event from backend
socket.on('locationMessage',(url) => {
   const html = Mustache.render(locationMessageTemplate,{
       url : url.url,
       createdAt : moment(url.createdAt).format("H:mm a"),
       username : url.username
   })
   $messages.insertAdjacentHTML('beforeend',html)
})
// set the users connected to the room in the template
// handle the roomData invoked methode from backend
socket.on('roomData',({room,users}) => {
   const html = Mustache.render(sideBarTemplate,{
       room,
       users

   })
   $sideBar.innerHTML = html
})
// listen for submit event
//invoke senMessage event and send the message typed by the user
// some user interface configuration like enable and disable button when submitting
$messageForm.addEventListener('submit',(e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled','disabled')
    const chatInput = e.target.elements.message
    var message = chatInput.value

    socket.emit('sendMessage',message,(error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=''
        $messageFormInput.focus()
     if(error)
     {
         return console.log(error)
     }
     console.log(message)
     console.log('Message delivred ! ')
    })
})

//
socket.on('getMessage',(message) => {
    console.log(message)
})

//event click listener on send location
//invoke senLocation event to send location data
sendLocation.addEventListener('click', () => {

    if(!navigator.geolocation)
    {
      return alert('Geolocation is not supported by your browser.')
    }
    $locationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        
       console.log(position)
       socket.emit('sendLocation',{
           latitude : position.coords.latitude,
           longitude : position.coords.longitude
       },() => {
        $locationButton.removeAttribute('disabled')
        console.log('location shared')
    })
    })
})

// invoke join to connect the user to the room 
// redirect user to the chat room
socket.emit('join',{username,room},(error) => { 
    if(error)
    {
        console.log(error)
        alert(error)
        location.href = '/'
    }
})