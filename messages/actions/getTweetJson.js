var builder = require('botbuilder');

module.exports = [
    function (session, args, next) {
        session.sendTyping();
        
        var tweetId = builder.EntityRecognizer.findEntity(args.intent.entities, 'tweetId');
        if (tweetId) {
            session.dialogData.tweetId = tweetId.entity;
            next({response: tweetId.entity});
        } else {
            builder.Prompts.text(session, 'Ok. What\'s the tweet id?');
        }
    },
    function (session, results) {
        var tweetId = results.response;
        var twitter = require('twitter');

        var twit = new twitter({
            consumer_key: process.env['TwitterConsumerKey'],
            consumer_secret: process.env['TwitterConsumerSecret'],
            access_token_key: process.env['TwitterAccessTokenKey'],
            access_token_secret: process.env['TwitterAccessTokenSecret']
        });

        var params = {
            id: tweetId,
            trim_user: false,
            include_my_retweet: true,
            include_entities: true
        };

        twit.get('statuses/show', params, function(error, tweets, response) {
            if (!error) {
                session.endDialog('Here\'s the JSON for `' + tweetId + '`: ```' + JSON.stringify(tweets) + '```');
            }
            else {
                console.log("error...", error);
                console.log("params",params);
                session.endDialog('Sorry. Something went wrong :( ```' + JSON.stringify(error) + '```');
            }
        });
    }
];