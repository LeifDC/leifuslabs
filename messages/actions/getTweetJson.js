var builder = require('botbuilder');

module.exports = [
    function (session, args, next) {
        session.sendTyping();
        
        var tweetId = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.number');
        if (tweetId) {
            session.dialogData.tweetId = tweetId.entity;
            next({response: tweetId.entity});
        } else {
            builder.Prompts.text(session, 'Ok. What\'s the tweet id?');
        }
    },
    function (session, results) {
        var msg = new builder.Message(session);

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
                var tweetStr = '```' + JSON.stringify(tweets) + '```';
                var channelData = {
                    text: 'Here\'s the JSON for ' + tweetId,
                    attachments: [{
                        fallback: tweetStr,
                        color: "#CCC",
                        title: 'View tweet',
                        title_link: 'https://twitter.com/status/' + tweetId,
                        text: tweetStr,
                        mrkdwn: true,
                        footer: "Twitter API",
                        footer_icon: "https://twitter.com/favicon.ico",
                        ts: Math.floor(new Date() / 1000)
                    }]
                };

                if (session.message.address.channelId === 'slack') {
                    msg.sourceEvent({slack: channelData});
                } else {
                    msg.text(JSON.stringify(channelData))
                }
                session.endDialog(msg);                
            }
            else {
                console.log("error...", error);
                console.log("params",params);
                session.endDialog('Sorry. Something went wrong :( ```' + JSON.stringify(error) + '```');
            }
        });
    }
];