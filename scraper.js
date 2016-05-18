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
    if(jsonData.bot_token){
        bot = new SlackBot({
             token: jsonData.bot_token,
             name: 'Recipes Bot'
        });       
    }
    
    newUrl = jsonData.url;
    
    
    var doScrap = function(){
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
                x(newUrl, jsonData.selector, [jsonData.recipe])(function(err, obj) {
                    data=obj.map(function(d){return applyRegex(jsonData.regex,d)});
                    cb(err,{data:data,next:next});
                });               
            });
        } else {
            x(newUrl,jsonData.recipe)(function(err,obj){
                if (!err) {
                    if (jsonData.regex){
                        obj = applyRegex(jsonData.regex,obj);
                    }
                }
                cb(err,obj);      
            });        
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
                doScrap();
            }
                
        });
    } else {
        doScrap();
    }
    
    

}

module.exports.scrap = scrap