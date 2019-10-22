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


//Options
const {username , room} = Qs.parse(location.search,{ignoreQueryPrefix : true})
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
socket.on('message',(message) => {
    
    const html = Mustache.render(messageTemplate,{
      message : message.text,
      createdAt : moment(message.createdAt).format("H:mm a"),
      username : message.username
    })
    console.log(message)
    $messages.insertAdjacentHTML('beforeend', html)
})


socket.on('locationMessage',(url) => {
   const html = Mustache.render(locationMessageTemplate,{
       url : url.url,
       createdAt : moment(url.createdAt).format("H:mm a"),
       username : url.username
   })
   $messages.insertAdjacentHTML('beforeend',html)
})

socket.on('roomData',({room,users}) => {
   const html = Mustache.render(sideBarTemplate,{
       room,
       users

   })
   $sideBar.innerHTML = html
})
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


socket.on('getMessage',(message) => {
    console.log(message)
})


document.querySelector('#send-location').addEventListener('click', () => {

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


socket.emit('join',{username,room},(error) => { 
    if(error)
    {
        console.log(error)
        alert(error)
        location.href = '/'
    }
})