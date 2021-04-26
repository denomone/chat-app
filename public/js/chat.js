const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton =  $messageForm.querySelector('button');

const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options

const autoScroll = () => {
    // New message
    const $newMessage = $messages.lastElementChild;

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible Height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight; 

    // How far scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }

    console.log(scrollOffset, containerHeight - newMessageHeight)
}

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm A')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('locationMessage', (message) => {
    console.log(message);

    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // disable
    $messageFormButton.setAttribute('disabled', 'disabled');

    const message = $messageFormInput.value;  
    socket.emit('sendMessage', message, (error) => {
        // enable
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();
        if (error) {
            return console.log(error);
        }
    });
});



socket.on('sendLocation', (location) => {
    console.log(`Location: ${location.latitude} ${location.longtitude}`);
});

$sendLocationButton.addEventListener('click', () => {
    $sendLocationButton.setAttribute('disabled', 'disabled');
    
    if (!navigator.geolocation) {
        return alert('Geolocation not supported');
    }

    navigator.geolocation.getCurrentPosition((position) => {     
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longtitude: position.coords.longitude
        }, (status) => {
            $sendLocationButton.removeAttribute('disabled');
            console.log(status);
        });
    });
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});