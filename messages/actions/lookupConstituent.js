var builder = require('botbuilder');
var request = require('request');

module.exports = [
    function (session, args, next) {
        session.sendTyping();
        
        var constituentSymbols = builder.EntityRecognizer.findAllEntities(args.intent.entities, 'constituentSymbol');
        if (constituentSymbols && constituentSymbols.length == 2) {
            var idxSymbol = constituentSymbols[0].entity;
            var constSymbol = constituentSymbols[1].entity;

            session.dialogData.indexSymbol = idxSymbol;
            session.dialogData.constituentSymbol = constSymbol;
            next({ indexSymbol: idxSymbol, constituentSymbol: constSymbol });
        } else {
            builder.Prompts.text(session, 'What constituent you want me to lookup?');
        }
    },
    function (session, results) {
        var idxSymbol = results.indexSymbol;
        var constituentSymbol = results.constituentSymbol;

        lookupConstituent(idxSymbol, constituentSymbol, function(response) {
            var msg = new builder.Message(session).sourceEvent({
                slack: response
            });
            session.endDialog(msg);
        });
    }
];



function lookupConstituent(indexSymbol, constituentSymbol, resolve) {
    var post_data = JSON.stringify({
        'filters':[{
            'indexSymbol': indexSymbol,
            'companySymbol': constituentSymbol
        }],
        'pagesize': 3,
        'includelatestnews': false
    });

    var post_options = {
        uri: 'http://trading.api.digitalcontact.co.uk/v4/company/search',
        port: '80',
        path: '/compile',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'basic ' + process.env.TradingApiKey,
            'Content-Length': Buffer.byteLength(post_data)
        }
    };

    var post_req = request(post_options, function (err, response, body) {
        var info = [];
        var opts = null;

//        if (rawResponse) {
//            info.push(body)
//            opts = {
//                "unfurl_links": false,
//                "unfurl_media": false
//            };
//        }
//        else {
            if (!err && response.statusCode === 200) {
                body = JSON.parse(body);

                var results = body[0].Results;

                if (results == null) {
                    info = ['No companies were found.' + JSON.stringify(response)];
                    resolve(info);
                }
                else {
                    if (results.length == 1) {
                        var topCompany = results[0];
                        var name = topCompany.Name;
                        var companySymbol = topCompany.Symbol;
                        var index = "";
                        var indexSymbol = "";
                        if (topCompany.DefaultIndex != null){
                            index = topCompany.DefaultIndex.Name;
                            indexSymbol = topCompany.DefaultIndex.Symbol;
                        }
                        else {
                            index = topCompany.MarketIndices[0].Name;
                            indexSymbol = topCompany.MarketIndices[0].Symbol;
                        }
                        
                        var currency = topCompany.CurrencySymbol;
                        var indices = [];
                        topCompany.MarketIndices.forEach(function(index){
                            var isDefault = index.IsDefaultIndex;
                            var url = "https://trading.co.uk/#!index/" + index.Symbol;
                            var indexStr = '<' + url + '|' + (isDefault ? '[' : '') + index.Name + (isDefault ? ']' : '') + '>';
                            indices.push(indexStr);
                        });
                        var sectors = topCompany.Sectors;
                        var logoUrl = topCompany.LogoUrl;
                        var pulse = topCompany.Pulse;
                        var mentions = topCompany.Mentions
                        var maxPulse = topCompany.MaxPulse
                        var openPulse = topCompany.OpenPulse
                        var storyCount = topCompany.Stories
                        var articleCount = topCompany.Articles
                        //var verificationState = topCompany.VerificationState

                        var latestStoryTitle = "No story found.";
                        var storyDate = "-";
                        var summary = "";

                        if (topCompany.LatestStory != null) {
                            latestStoryTitle = topCompany.LatestStory.Title;
                            storyDate = topCompany.LatestStory.EarliestDateFound;
                            summary = topCompany.LatestStory.Summary.substring(0,255) + '...';
                        };

                        var channelData = {
                            text: 'Here\'s what I found.',
                            attachments: [{
                                'fallback': companySymbol + ' - ' + index + ' (' + currency + ')',
                                'color': "#36a64f",
                                //"pretext": "",
                                'author_name': companySymbol + ' - ' + index + ' (' + currency + ')',
                                'title': name,
                                'title_link': 'https://trading.co.uk/#!company/' + indexSymbol + '/' + companySymbol,
                                'text':'sub text is here...'
                                thumb_url: logoUrl
                                //text: "",
                                fields: [
                                    {
                                        title: "Open | Current | Max Pulse",
                                        value: openPulse + ' | ' + pulse + ' | ' + maxPulse,
                                        short: true
                                    },
                                    {
                                        title: "Stories/Articles",
                                        value: storyCount + '/' + articleCount,
                                        short: true
                                    },
                                    {
                                        title: "Mentions",
                                        value: mentions,
                                        short: true
                                    },
                                    {
                                        title: "Sectors",
                                        value: sectors.join(', '),
                                        short: true
                                    },
                                    {
                                        title: "Market Indices",
                                        value: indices.join(', '),
                                        short: false
                                    },
                                    {
                                        title: "News @ " + storyDate + ": " + latestStoryTitle,
                                        value: summary,
                                        short: false
                                    }
                                ],
                                footer: "Trading API",
                                footer_icon: "https://trading.co.uk/img/logo.png",
                                ts: Math.floor(new Date() / 1000)
                            }]
                        };

                        resolve(channelData);
                    }
                    else {
                        info = ["I found " + results.length + " companies"];
                        attachments = [];

                        results.forEach(function(company) {
                            var name = company.Name;
                            var companySymbol = company.Symbol;
                            var index = "";
                            var indexSymbol = "";
                            if (company.DefaultIndex != null){
                                index = company.DefaultIndex.Name;
                                indexSymbol = company.DefaultIndex.Symbol;
                            }
                            else {
                                index = company.MarketIndices[0].Name;
                                indexSymbol = company.MarketIndices[0].Symbol;
                            }
                            var logoUrl = company.LogoUrl;
                            var pulse = company.Pulse;
                            var mentions = company.Mentions
                            var maxPulse = company.MaxPulse
                            var openPulse = company.OpenPulse
                            var storyCount = company.Stories
                            var articleCount = company.Articles
                            
                            var latestStoryTitle = "No story found.";
                            var storyDate = "-";

                            if (company.LatestStory != null) {
                                latestStoryTitle = company.LatestStory.Title;
                                storyDate = company.LatestStory.EarliestDateFound;
                            };

                            attachments.push({
                                "fallback": companySymbol + ' - ' + index,
                                "color": "#36a64f",
                                //"pretext": "",
                                "author_name": companySymbol + ' - ' + index,
                                "title": name,
                                "title_link": 'https://trading.co.uk/#!company/' + indexSymbol + '/' + companySymbol,
                                //"thumb_url": logoUrl,
                                "text": "",
                                "fields": [
                                    {
                                        "title": "Open | Current | Max Pulse",
                                        "value": openPulse + ' | ' + pulse + ' | ' + maxPulse,
                                        "short": true
                                    },
                                    {
                                        "title": "Stories/Articles",
                                        "value": storyCount + '/' + articleCount,
                                        "short": true
                                    },
                                    //{
                                        //"title": "Mentions",
                                        //"value": mentions,
                                        //"short": true
                                    //},
                                    //{
                                        //"title": latestStoryTitle,
                                        //"value": storyDate,
                                        //"short": false
                                    //}
                                ],
                                //"footer": "Trading API",
                                //"footer_icon": "https://trading.co.uk/img/logo.png",
                                //"ts": Math.floor(new Date() / 1000)
                            });
                        });

                        opts = { "attachments": attachments }

                        resolve(info);
                    }
                }
            }
            else {
                if (response.statusCode === 403) {
                    info.push(response.statusCode + ": " + JSON.parse(response.body).Errors[0].Reason);
                    resolve(info);
                }
                else {
                    info.push("Hmmm...Um, Something went a bit pear-shaped!");
                    info.push(response.statusCode + ": " + JSON.parse(response.body).Errors[0].Reason);
                    info.push(err);
                    info.push("Body:" + body);
                    resolve(info);
                }
            }
        //}
    });

  post_req.write(post_data);
  post_req.end();
}