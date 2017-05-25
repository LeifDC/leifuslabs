'use strict';
var builder = require('botbuilder');
var botbuilder_azure = require('botbuilder-azure');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;


if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}


// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
bot.recognizer(recognizer);

bot.dialog('LookupUrl', require('./actions/lookupUrl'))
    .triggerAction({
        matches: 'LookupUrl',
        onInterrupted: function (session) {
            session.endDialog('Um. LookupUrl Interrupted.');
        }
    });

bot.dialog('LookupConstituent', require('./actions/lookupConstituent'))
    .triggerAction({
        matches: 'LookupConstituent',
        onInterrupted: function (session) {
            session.endDialog('Um. LookupConstituent Interrupted.');
        }
    });

bot.dialog('GetTweetJson', require('./actions/getTweetJson'))
    .triggerAction({
        matches: 'GetTweetJson',
        onInterrupted: function (session) {
            session.endDialog('Um. GetTweetJson Interrupted.');
        }
    });

bot.dialog('Help', function (session) {
    session.endDialog('Hi! You can ask me to lookup a company or get a tweet for you. For example: "lookup nas aapl" or "get tweet json 862355572347351040"');
}).triggerAction({
    matches: 'Help'
});

bot.dialog('/', function (session) {
    session.endDialog('Sorry, I don\'t understand. Try asking me to lookup a url.');
}).triggerAction({
    matches: '/'
});