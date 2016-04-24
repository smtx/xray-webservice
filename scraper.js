var Xray = require('x-ray');
var xraydriver = require('./x-ray-driver');
var x = Xray();

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
    if (jsonData.charset){
        x.driver(xraydriver(jsonData.charset));
    } else {
        x.driver(xraydriver('utf-8'));
    }
    if (jsonData.paginate!==undefined && jsonData.selector!==undefined){
        // scrap array of data
        x(jsonData.url, jsonData.paginate)(function(err, next) {
            var data;
            if (err){
                cb(err,data);
            }
            x(jsonData.url, jsonData.selector, [jsonData.recipe])(function(err, obj) {
                data=obj;
                cb(err,{data:data,next:next});
            });               
        });
    } else {
        x(jsonData.url,jsonData.recipe)(function(err,obj){
            if (!err) {
                if (jsonData.regex){
                    obj = applyRegex(jsonData.regex,obj);
                }
            }
            cb(err,obj);      
        });        
    }
}

module.exports.scrap = scrap