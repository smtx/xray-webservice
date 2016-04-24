var express = require('express'),
    bodyParser  = require("body-parser"),
    app = express();

var scraper = require("./scraper");
var Promise = require("bluebird");
Promise.promisifyAll(scraper);


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.status(200).send('ok');
});

app.post('/', function (req, res){
  scraper.scrapAsync(req.body)
    .then(function(data){
      res.json(data);
    });
});

var server = app.listen(3000, function () {
  var port = server.address().port;
  console.log('Example app listening at port %s', port);
});
module.exports = server;