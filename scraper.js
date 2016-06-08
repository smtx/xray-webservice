var cheerio = require('cheerio');
var Xray = require('x-ray');
var xraydriver = require('./x-ray-driver');
var x = Xray();

var SlackBot = require('slackbots');
var bot;

var pageNum,
    pagePath,
    newUrl,
    enhancedParam;

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

function applyRegex(regex,obj){ // Apply regular expressions to obj
    if (typeof obj == 'string'){
        // Apply single regexp if obj is a string
        obj = setRegex(obj,regex);
    } else {
        if (obj){
            Object.keys(obj).forEach(function(k){
                if (typeof obj[k] == 'string'){
                    obj[k] = setRegex(obj[k],regex[k]);
                } else {
                    // apply regexp to array or object
                    Object.keys(obj[k]).forEach(function(n){
                        if( regex[k+'.'+n] ){
                            // apply regexp to nested object
                            obj[k][n] = setRegex(obj[k][n],regex[k+'.'+n]);
                        } else {
                            // apply regexp to array element
                            obj[k][n] = setRegex(obj[k][n],regex[k]);
                        }
                    });
                }
            });
        }
    }

    return obj;

    function setRegex(obj,regex){
        if (!regex){
        return obj;
        }
        var data = obj;
        // assign first match of regex if possible, zero if no match
        if (arrMatches = data.match(regex)){
            data = arrMatches[1] || arrMatches[0];
        } else {
            data = 0;
        }
        return data;
    }

}

function scrap(jsonData,cb){
    console.log('scraping',jsonData.url);
    if(jsonData.bot_token){
        bot = new SlackBot({
             token: jsonData.bot_token,
             name: 'Recipes Bot'
        });
    }

    newUrl = jsonData.url;




    var doScrap = function(cb){
      try{
        const MAX_ERROR_COUNT = 50;
        const MAX_ERROR_COUNT_FOR_ARTICLE = 1;
        const URI = require('urijs');

         var errorsInKeys = JSON.parse(JSON.stringify(jsonData.recipe));
         var keysInRecipe = Object.keys(jsonData.recipe);
         for(var prop in errorsInKeys){
             errorsInKeys[prop] = 0;
         }

        // if xml flag exists, switch cheerio to admit XML special elements CDATA, etc.
        if (jsonData.xml){
            cheerio.prototype.options.xmlMode = true;
        } else {
            cheerio.prototype.options.xmlMode = false;
        }

        if (jsonData.charset){
            x.driver(xraydriver(jsonData.charset));
        } else {
            x.driver(xraydriver('utf-8'));
        }
        if (jsonData.paginate!==undefined && jsonData.selector!==undefined){
            // scrap array of data
            x(newUrl, jsonData.paginate)(function(err, next) {
                var data;
                if (err){
                    cb(err,data);
                }
                console.log('newUrl',newUrl);
                console.log('next',next);
                if (next){
                  next = URI(newUrl).equals(next) === true ? '' : next;
                }
                console.log('next',next);
                x(newUrl, jsonData.selector, [jsonData.recipe]).paginate(jsonData.paginate).limit(jsonData.limit || 1)(function(err, obj) {
                    if (!err) {
                        data=obj.map(function(d){return jsonData.regex ? applyRegex(jsonData.regex,d) : d});
                    }
                    var result = {data:data};
                    if (next && (!jsonData.limit || jsonData.limit == 1)) result.next = next;
                    cb(err,result);
                    if (data) {
                        var b;
                        for(var a in data){
                            for(var c = 0; c < keysInRecipe.length; c++){
                                var count = 0;
                                if(a != 'last'){
                                    if(!data[a].hasOwnProperty(keysInRecipe[c]))
                                    {
                                        count++;
                                        errorsInKeys[keysInRecipe[c]] += count;
                                        if(errorsInKeys[keysInRecipe[c]] >= MAX_ERROR_COUNT)
                                        {
                                            b = true;
                                        }

                                    }
                                }
                            }
                        }
                        if(bot && b)
                        {
                            var fields = [];
                            for (var property in errorsInKeys) {
                                if (errorsInKeys.hasOwnProperty(property) && errorsInKeys[property] >= MAX_ERROR_COUNT) {
                                    var field = {};
                                    field.value = 'Errores: ' + errorsInKeys[property];
                                    field.title = 'Propiedad: ' + property;
                                    fields.push(field);
                                }
                            }
                            bot.postMessageToGroup('pulpou-notifications', "<@eliseoci>", {
                                "attachments": [
                                    {
                                        "fallback": "Info no capturada en receta.",
                                        "color": 'danger',
                                        "pretext":"Info no capturada en recipe LS",
                                        "title": "Marketplace: " + req.body.url,
                                        "text": "",
                                        "fields": fields,
                                        "mrkdwn_in": "fields"
                                    }
                                ]
                            },function (data) {
                                if(data.error) console.log(data.error);
                            });
                        }
                    }
                });
            });
        } else {
            x(newUrl,jsonData.recipe)(function(err,obj){
                if (!err) {
                    if (jsonData.regex){
                        obj = applyRegex(jsonData.regex,obj);
                    }
                    for(var c = 0; c < keysInRecipe.length; c++){
                        var count = 0;
                        var b;
                        if(!obj.hasOwnProperty(keysInRecipe[c])) {
                            count++;
                            errorsInKeys[keysInRecipe[c]] += count;
                            if(errorsInKeys[keysInRecipe[c]] >= MAX_ERROR_COUNT_FOR_ARTICLE)
                            {
                                b = true;
                            }
                        }
                    }
                    if(bot && b){
                        var fields = [];
                        for (var property in errorsInKeys) {
                            if (errorsInKeys.hasOwnProperty(property) && errorsInKeys[property] >= MAX_ERROR_COUNT_FOR_ARTICLE) {
                                var field = {};
                                field.value = 'Errores: ' + errorsInKeys[property];
                                field.title = 'Propiedad: ' + property;
                                fields.push(field);
                            }
                        }
                        bot.postMessageToGroup('pulpou-notifications', "<@eliseoci>", {
                            "attachments": [
                                {
                                    "fallback": "Info no capturada en receta.",
                                    "color": 'danger',
                                    "pretext":"Info no capturada en recipe article",
                                    "title": "Marketplace: " + req.body.url,
                                    "text": "",
                                    "fields":fields,
                                    "mrkdwn_in": "fields"
                                }
                            ]
                        },function (data) {
                            if(data.error) console.log(data.error);
                        });
                    }
                }
                cb(err,obj);
            });
        }
      } catch(e){
        // Error inesperado en el scrapeo.
        if (bot){
            // Send error to slackbot
            bot.postMessageToGroup('pulpou-notifications', "<@eliseoci>", {
                "attachments": [
                    {
                        "fallback": "Error generar en XRay scraper.",
                        "color": 'danger',
                        "pretext":"Un error inesperado en el procesamiento de receta",
                        "title": "URL: " + newUrl,
                        "recipe": jsonData
                    }
                ]
            },function (data) {
                if(data.error) console.log(data.error);
            });

        }
      }
    }

    // if wait flag call nightmarejs to get html source with ajax/interaction
    if (jsonData.nightmare) {
        var request = require("request");
        var options = {
                method: 'POST',
                url: jsonData.nightmare.url,
                headers: {
                    'cache-control': 'no-cache',
                    'content-type': 'application/json'
                },
                body: {
                    url: newUrl,
                    recipe: jsonData.nightmare.recipe
                },
                json: true
            }

        request(options,function (err, response,body){
            if (err){
                throw new Error(err);
            } else {
                newUrl = body;
                doScrap(cb);
            }

        });
    } else {
        doScrap(cb);
    }



}

module.exports.scrap = scrap
