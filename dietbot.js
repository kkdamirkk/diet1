var TelegramBot = require('node-telegram-bot-api');
var FileSystem = require('fs');
var Request = require('request');


var token = getTokenAccess();
var catchPhrases = getCatchPhrases();

var botOptions = {
    polling: true
};

var globalCountOfMessagesWithDigest = 0;
var globalUserNameIs;
var globalBotUserName;

bot.getMe().then(function(me)
{
    console.log('Hello! My name is %s!', me.first_name);
    console.log('My id is %s.', me.id);
    console.log('And my username is @%s.', me.username);
    globalBotUserName = me.username;
});

bot.on('text', function(msg)
{
	
	   // Set main variables
    var messageChatId = msg.chat.id;
    var messageText = msg.text;
    var messageDate = msg.date;
    globalUserNameIs = msg.from.username;
	
	
	    if (messageText === '/start' || messageText === '/start@'+globalBotUserName) {
        sendMessageByBot(messageChatId, catchPhrases.startCommand[0]);
    }
	
	if (messageText === '/recipe' || messageText === '/recipe@'+globalBotUserName) {

var opts = {

reply_markup: JSON.stringify({
keyboard: [
['Breakfast'],
['Lunch'],
['Dinner'] 
]
})
};
bot.sendMessage(messageChatId, 'What do you want?', opts);
}

if (messageText === 'Breakfast') {
bot.sendMessage(messageChatId, 'Recept Zavtraka', { caption: 'I\'m bot!' });
}

if (messageText === 'Lunch') {
bot.sendMessage(messageChatId, 'Kakashaka', { caption: 'I\'m bot!' });
}
if (messageText === 'Dinner') {
bot.sendMessage(messageChatId, '14/88', { caption: 'I\'m bot!' });
}
});


function sendNoAccessMessage(aChatId)
{
    sendMessageByBot(aChatId, catchPhrases.debugCommandMessages[0]);
}


