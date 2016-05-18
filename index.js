var express = require('express'),
    bodyParser  = require("body-parser"),
    app = express();

var scraper = require("./scraper");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.status(200).send('ok');
});

app.post('/', function (req, res){
  scraper.scrap(req.body,function(err,data){
      res.json(data);    
  });
});

var server = app.listen(8888, function () {
  var port = server.address().port;
  console.log('Example app listening at port %s', port);
});
module.exports = app;