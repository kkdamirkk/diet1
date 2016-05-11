/************************************************************************************
** The MIT License (MIT)
**
** Copyright (c) 2015 Serg "EXL" Koles
**
** Permission is hereby granted, free of charge, to any person obtaining a copy
** of this software and associated documentation files (the "Software"), to deal
** in the Software without restriction, including without limitation the rights
** to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
** copies of the Software, and to permit persons to whom the Software is
** furnished to do so, subject to the following conditions:
**
** The above copyright notice and this permission notice shall be included in all
** copies or substantial portions of the Software.
**
** THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
** IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
** FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
** AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
** LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
** OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
** SOFTWARE.
************************************************************************************/

var TelegramBot = require('node-telegram-bot-api');
var FileSystem = require('fs');
var Http = require('http');
var Request = require('request');

var token = getTokenAccess();
var catchPhrases = getCatchPhrases();

    {
        host: 'www.cbr.ru',
        port: 80,
        path: '/scripts/XML_daily.asp?'
    },
    {
        host: 'www.bank-ua.com',
        port: 80,
        path: '/export/currrate.xml'
    }
];

    host: "www.cbr.ru",
    port: 80,
    path: "/hd_base/?PrtId=metall_base_new"
};

var botOptions = {
    polling: true
};

var bot = new TelegramBot(token, botOptions);

var globalCountOfMessagesWithDigest = 0;
var globalUserNameIs;
var globalBotUserName;

var globalStackListDigestMessages = [ ];



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

    // DEBUG SECTION
    // console.log(msg);
    // END DEBUG SECTION



   
    // HELP COMMAND
    if (messageText === '/help' || messageText === '/help@'+globalBotUserName) {
        sendMessageByBot(messageChatId, generateHelpString());
    }

    // START COMMAND
    if (messageText === '/start' || messageText === '/start@'+globalBotUserName) {
        sendMessageByBot(messageChatId, catchPhrases.startCommand[0]);
    }
    
    // DEBUG SECTION
    // HELLO COMMAND
    if (messageText === '/hello' || messageText === '/hi'
            || messageText === '/hello@'+globalBotUserName || messageText === '/hi@'+globalBotUserName) {
        if (getAdminRights()) {
            sendMessageByBot(messageChatId,
                             catchPhrases.helloCommand[getRandomInt(0, catchPhrases.helloCommand.length - 1)]);
        }
    }

    // ADMINISTRATION COMMANDS
    // SEND COMMAND
    if (messageText.indexOf('/send') === 0) {
        if (getAdminRights()) {
            messageText = messageText.trim();
            var splitSendList = messageText.split(' ');
            if (splitSendList.length > 2) {
                var targetChatID = splitSendList[1];
                sendMessageByBot(targetChatID, getSendMessage(messageText, '/send ' + targetChatID));
            } else {
                sendMessageByBot(messageChatId,
                                 catchPhrases.debugCommandMessages[8]);
            }
        } else {
            sendNoAccessMessage(messageChatId);
        }
    }



function downloadImageAndSendToChat(aUri, aFileName, aChatId)
{
    Request.head(aUri, function(aErr, aRes, aBody) {
        Request(aUri).pipe(FileSystem.createWriteStream(aFileName)).on('close', function() {
            sendChartFileToChat(aChatId, aFileName);
        });
    });
}

function sendChartFileToChat(aChatId, aImageName)
{
    if (aImageName) {
        bot.sendPhoto(aChatId, aImageName, { caption: catchPhrases.debugCommandMessages[9] + ' ' + globalExchange.desc });
    }
}

function sendChartToChat(aChatId, aExchangeId)
{
    if (globalExchangeList[aExchangeId]) {
        globalExchange = globalExchangeList[aExchangeId];
        downloadImageAndSendToChat(globalExchangeList[aExchangeId].url,
                                   addYourStringToString('./', aExchangeId + '_image.png'),
                                   aChatId);
    } else {
        sendMessageByBot(aChatId,
                         generateChartsHelpString());
    }
}

function sendChunksMessagesByBot(aChatId, aMesssage, aChunkSize)
{
    for (var j = 0, botAnswerLength = aMesssage.length; j < botAnswerLength; j+=aChunkSize) {
        sendMessageByBot(aChatId,  aMesssage.substring(j, j + aChunkSize));
    }
}

function generateHelpString()
{
    var botAnswer = '';
    for (var i = 0; i < catchPhrases.helpCommand.length; ++i) {
        botAnswer += catchPhrases.helpCommand[i] + '\n';
    }

    if (getAdminRights()) {
        for (var j = 0; j < catchPhrases.helpCommandAdmin.length; ++j) {
            botAnswer += catchPhrases.helpCommandAdmin[j] + '\n';
        }
    }

    // Delete last line break
    botAnswer.trim();

    return botAnswer;
}

function sendNoAccessMessage(aChatId)
{
    sendMessageByBot(aChatId, catchPhrases.debugCommandMessages[0]);
}

function getMessageDelay(aCountOfDay)
{
    // 86 400 for 24-hours.
    return aCountOfDay * 86400;
}

function getSendMessage(aString, aTrim)
{
    return aString.replace(aTrim, '').trim();
}

function getQuote(aString)
{
    var quote = '';
    if (/"/.test(aString)) {
        quote = aString.match(/"([^"]*)"/ )[1];
    }
    return quote;
}

function trimEachString(aString)
{
    return aString.split('\n').map(function(aLine)
    {
        aLine = aLine.trim();
        return aLine;
    }).join('\n');
}

function capitalizeFirstLetterOfEachString(aString)
{
    return aString.split('\n').map(function(aLine)
    {
        aLine = aLine[0].toUpperCase() + aLine.substr(1);
        return aLine;
    }).join('\n');
}

function replaceLineBreaksByYourString(aString, aYourString)
{
    return aString.replace(/(?:\r\n|\r|\n)/g, aYourString);
}

function getAdminRights()
{
    return globalUserNameIs === 'exlmoto' || globalUserNameIs === 'ZorgeR';
}

function getDigestReportHeader()
{
    return catchPhrases.digestCommandHello[getRandomInt(0, catchPhrases.digestCommandHello.length - 1)]
            + '\n'
            + catchPhrases.digestCommandHeader[getRandomInt(0, catchPhrases.digestCommandHeader.length - 1)]
            + '\n';
}

function sendNoDigestMessages(aChatId)
{
    sendMessageByBot(aChatId,
                     catchPhrases.digestCommandNoMessages[
                         getRandomInt(0, catchPhrases.digestCommandNoMessages.length - 1)]);
}

function sendMessageByBot(aChatId, aMessage)
{
    // Replace '%username%' by userName.
    var readyMessage = aMessage.replace('%username%', '@' + globalUserNameIs);
    bot.sendMessage(aChatId, readyMessage, { caption: 'I\'m a cute bot!' });
}

function getRandomInt(aMin, aMax)
{
    return Math.floor(Math.random() * (aMax - aMin + 1)) + aMin;
}

function getCountDigestMessagesOfChat(aChatId, aObsoleteDate)
{
    var stackSize = globalStackListDigestMessages.length;
    var countOfMessages = 0;
    for (var i = 0; i < stackSize; ++i) {
        if (globalStackListDigestMessages[i].s_chatID === aChatId) {
            if (globalStackListDigestMessages[i].s_date > aObsoleteDate) {
                countOfMessages++;
            }
        }
    }
    return countOfMessages;
}

function deleteObsoleteDigestMessages(aObsoleteDate)
{
    var stackSize = globalStackListDigestMessages.length;

    var position = 0;
    for (var i = 0; i < stackSize; ++i) {
        if (globalStackListDigestMessages[i].s_date < aObsoleteDate) {
            position++;
        }
    }

    // All stack digest messages are obsolete.
    // Drop stack.
    if (position == stackSize) {
        globalStackListDigestMessages = [ ];
        return false;
    }

    // All stack digest messages are relevant.
    // Print them.
    if (position == 0) {
        return true;
    }

    // Replace current digest stack by sliced.
    globalStackListDigestMessages = globalStackListDigestMessages.slice(position);

    // Return true if stack not empty
    return stackSize > 0;
}

function normalizeMessage(aMessage)
{
    var normalMessage = '';

    if (!isEmpty(aMessage)) {
        // Delete #digest tag from message
        normalMessage = aMessage.replace('#digest', '');

        // Delete %username% variable
        if (!(isBlank(normalMessage))) {
            normalMessage = normalMessage.replace('%username%', '');
        }

        // Ttrim all trailing spaces
        if (!(isBlank(normalMessage))) {
            normalMessage = normalMessage.trim();
        }

        // Replace multiple spaces with a single space
        if (!(isBlank(normalMessage))) {
            normalMessage = normalMessage.replace(/  +/g, ' ');
        }

        // Replace multiple line breaks with a single line break
        if (!(isBlank(normalMessage))) {
            normalMessage = normalMessage.replace(/\n{2,}/g, '\n');
        }
    }

    return normalMessage;
}

function isEmpty(aString)
{
    return (!aString || 0 === aString.length);
}

function isBlank(aString)
{
    return (!aString || /^\s*$/.test(aString));
}

function getTokenAccess()
{
    var parsedJsonFromFile = getJSONFileFromFileSystem('BOT_TOKEN_ACCESS.json');
    var token = parsedJsonFromFile.botTokenAccess;

    if (token === 'PLEASE_WRITE_YOU_TOKEN_HERE') {
        console.error('Error: Token is empty!\nPlease write your token in \'BOT_TOKEN_ACCESS.json\' file.');
        process.exit(1);
        return false;
    }

    return token;
}

function getCatchPhrases()
{
    return getJSONFileFromFileSystem('CatchPhrases.json');
}

function readSavedStackFromFileSystem(aFileName, aMessageId)
{
    var dotSlashName = addYourStringToString('./', aFileName);
    FileSystem.readFile(dotSlashName, 'utf-8', function(aError, aData) {
        if (aError) {
            sendMessageByBot(aMessageId,
                             catchPhrases.fileCommand[3]);
            return aError;
        }
        sendMessageByBot(aMessageId,
                         catchPhrases.fileCommand[1]);
        globalStackListDigestMessages = JSON.parse(aData);
    });
}

function getJSONFileFromFileSystem(aFileName)
{
    var dotSlashName = addYourStringToString('./', aFileName);
    return JSON.parse(FileSystem.readFileSync(dotSlashName, 'utf-8'));
}

function writeJSONFileToFileSystem(aFileName, aMessageChatId)
{
    if (globalStackListDigestMessages.length > 0) {
        var dotSlashName = addYourStringToString('./', aFileName);
        FileSystem.writeFile(dotSlashName, JSON.stringify(globalStackListDigestMessages, null, 4), function(aError) {
            if (aError) {
                sendMessageByBot(aMessageChatId,
                                 catchPhrases.fileCommand[2] + '\n' + aError);
            } else {
                sendMessageByBot(aMessageChatId,
                                 catchPhrases.fileCommand[0]);
            }
        });
    } else {
        sendMessageByBot(aMessageChatId,
                         catchPhrases.debugCommandMessages[2]);
    }
}

function addYourStringToString(aYourString, aString)
{
    return aYourString + aString;
}
