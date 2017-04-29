"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

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


bot.dialog('LookupUrl', [
    function (session, args, next) {
        session.sendTyping();
        
        var url = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.url');
        if (url) {
            session.dialogData.url = 'url';
            next({ response: url.entity });
        } else {
            // no entities detected, ask user for a destination
            builder.Prompts.text(session, 'Please provide a url');
        }
    },
    function (session, results) {
        var url = results.response;
        
        Store.lookupUrl(url)
            .then(function (data) {
                session.send('Here\'s what I\'ve found for ' + url + ':');
		        session.endDialog(data.join('\n'));
            });
    }
]).triggerAction({
    matches: 'LookupUrl',
    onInterrupted: function (session) {
        session.send('Um. Please provide a url');
    }
});

bot.dialog('Help', function (session) {
    session.endDialog('Hi! Try asking things like \'lookup [url]\' or \'What do we have for [ur]\'.');
}).triggerAction({
    matches: 'Help'
});
