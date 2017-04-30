var builder = require('botbuilder');

module.exports = [
    function (session, args, next) {
        session.sendTyping();
        
        var url = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.url');
        if (url) {
            session.dialogData.url = url.entity;
            next({response: url.entity});
        } else {
            builder.Prompts.text(session, 'Ok. What url?');
        }
    },
    function (session, results) {
        var url = results.response;
        //Store
            //.lookupUrl(url)
            //.then(function (data) {
                //session.send('Here\'s what I\'ve found for ' + url + ':');
                //session.endDialog(data.join('\n'));
            //});
        session.endDialog('Here\'s what I\'ve found for ' + url + ':');
    }
];