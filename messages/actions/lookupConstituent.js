var builder = require('botbuilder');

module.exports = [
    function (session, args, next) {
        session.sendTyping();
        
        var constituentSymbol = builder.EntityRecognizer.findEntity(args.intent.entities, 'constituentSymbol');
        if (constituentSymbol) {
            session.dialogData.constituentSymbol = constituentSymbol.entity;
            next({ response: constituentSymbol.entity});
        } else {
            builder.Prompts.text(session, 'What constituent you want me to lookup?');
        }
    },
    function (session, results) {
        var constituentSymbol = results.response;
        session.endDialog('Here\'s the constituent for: ' + constituentSymbol + ':');
    }
];