var builder = require('botbuilder');

module.exports = [
    function (session, args, next) {
        session.sendTyping();
        
        var url = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.url');
        session.dialogData.url = url.entity;
        if (url) {
            next();
        } else {
            builder.Prompts.text(session, 'What do you want me to lookup?');
        }
    },
    function (session) {
        var url = session.dialogData.url;
        //Store
            //.lookupUrl(url)
            //.then(function (data) {
                //session.send('Here\'s what I\'ve found for ' + url + ':');
                //session.endDialog(data.join('\n'));
            //});
        session.endDialog('Here\'s what I\'ve found for ' + url + ':');
    }
];