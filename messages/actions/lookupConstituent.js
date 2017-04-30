var builder = require('botbuilder');

module.exports = [
    function (session, args, next) {
        session.sendTyping();
        
        var constituentSymbol = builder.EntityRecognizer.findEntity(args.intent.entities, 'constituentSymbol');
        session.dialogData.constituentSymbol = constituentSymbol;
        if (constituentSymbol) {
            next();
        } else {
            builder.Prompts.text(session, 'What constituent you want me to lookup?');
        }
    },
    function (session) {
        var constituentSymbol = session.dialogData.constituentSymbol;
        session.endDialog('Here\'s the constituent for: ' + constituentSymbol + ':');
    }
];