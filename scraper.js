var Xray = require('x-ray');
var xraydriver = require('./x-ray-driver');
var x = Xray();

function setRegex(obj,regex){
    if (!regex) return obj;
    // var data = obj.replace(/["|.]/g,'');
    var data = obj;
    if (arrMatches = data.match(regex)){
        data = arrMatches[1] || arrMatches[0];
    } else {
        data = 0;
    }
    return data;
}

function scrap(jsonData,cb){
    if (jsonData.charset){
        x.driver(xraydriver(jsonData.charset));
    } else {
        x.driver(xraydriver('utf-8'));
    }
    x(jsonData.url,jsonData.recipe)(function(err,obj){
        if (err) {
            cb(err,obj);
        } else {
            if (jsonData.regex){
                if (typeof obj == 'string'){
                    obj = setRegex(obj,jsonData.regex);
                } else {
                    if (obj){
                        Object.keys(obj).forEach(function(k){
                            if (typeof obj[k] == 'string'){
                                obj[k] = setRegex(obj[k],jsonData.regex[k]);                            
                            } else {
                                Object.keys(obj[k]).forEach(function(n){
                                    if( req.body.regex[k+'.'+n] ){
                                        obj[k][n] = setRegex(obj[k][n],jsonData.regex[k+'.'+n]);                                                                                    
                                    } else {
                                        obj[k][n] = setRegex(obj[k][n],jsonData.regex[k]);                                        
                                    }
                                });
                            }
                        });
                    }
                }
            }
            cb(err,obj);         
        }
        
    });
}

module.exports.scrap = scrap