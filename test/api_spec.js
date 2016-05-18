
var url       = 'http://localhost:8889/static.html';
var url2      = 'http://localhost:8889/static.iso8859.html';
var dynamic_url = 'http://localhost:8889/dynamic.html';

var chai      = require('chai');
var chaiHttp  = require('chai-http');
var app    = require('../index');
var should    = chai.should();
var express = require('express');

// serve static content for API testing
app.use(express.static('test/static'));
var server = app.listen(8889, function () {
  var port = server.address().port;
  console.log('Example app listening at port %s', port);
});

chai.use(chaiHttp);

after(function(){
  server.close();
});

describe('Express server is working when...', function(){
    it('responds to /', function(done){
      chai.request(server)
        .get('/')
        .end(function(err, res){
          res.should.have.status(200);
          done();
        });
    });
    it('404 everything else', function(done) {
      chai.request(server)
        .get('/foo/bar')
        .end(function(err, res){
          res.should.have.status(404);
          done();
        });
    });  
});
describe ('JSON Recipes', function(){
  describe('are valid when', function() {
    describe('get single data', function() {
      it('get page title from recipe', function(done){
        chai.request(server)
          .post('/')
          .send({'url': url, 'recipe': 'title'})
          .end(function(err, res){
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('string');
            res.body.should.be.equal('This is the title');
            done();
          });
      });
      it('get number applying regex', function(done){
        chai.request(server)
          .post('/')
          .send({'url': url, 'recipe': 'div.price', 'regex': '(\\d+,?\\d*\\.?\\d*)'})
          .end(function(err, res){
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('string');
            res.body.should.be.equal('10,333.23');
            done();
          });
      });
      it('get data with correct charset', function(done){
        chai.request(server)
          .post('/')
          .send({'url': url2, 'recipe': 'title', 'charset': 'iso8859-15'})
          .end(function(err, res){
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a('string');
            res.body.should.be.equal('Título');
            done();
          });
      });
      it('get json with nested data with correct charset and using regex', function(done){
        chai.request(server)
          .post('/')
          .send({ 
            "url": url2,
            "recipe": {
                "title":"section#article h3",
                "image":"section#article img@src",
                "price":"div.price",
                "seller":{
                    "name": "a.seller p:nth-child(1)",
                    "city": "a.seller p:last-child"
                }
            },
            "regex": {
                "price":"(\\d+,?\\d*\\.?\\d*)",
                "seller.name":"Vendedor: (.+)",
                "seller.city":"Ciudad: (.+)"
            },
            "charset": "iso-8859-15"
        })
        .end(function(err,res){
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.an('object');
            res.body.title.should.be.equal("Título del artículo");
            res.body.image.should.be.equal("http://lorempixel.com/400/200/");
            res.body.price.should.be.equal("10,333.23");
            res.body.seller.should.be.an('object');
            res.body.seller.name.should.be.equal("Sebastián Ríos");
            res.body.seller.city.should.be.equal("San Martín de los Andes");
            done();
        });
      });

    });
    describe('get array data with regex', function(){
      it('get data as array', function(done){
        chai.request(server)
          .post('/')
          .send({ 
              "url": url,
              "recipe": {
                "title":"div.items-info h3",
                "image":"figure.items-image img@data-original",
                "price":"p.items-price",
                "permalink":"a@href",
                "seller":{
                    "name": "a.seller p:nth-child(1)",
                    "city": "a.seller p:last-child"
                }
              },
              "paginate": "footer section#pagination a.next@href",
              "selector": "ul li.item",
              "limit": 1,
              "regex": {
                  "price":"(\\d+,?\\d*\\.?\\d*)",
                  "seller.name":"Vendedor: (.+)",
                  "seller.city":"Ciudad: (.+)"
              }
          })
          .end(function(err, res){
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.an('object');
            res.body.data.should.be.an('array');
            res.body.data.length.should.be.equal(3);
            res.body.data[0].title.should.be.equal('IPAD MINI 16gb SILVER IMPECABLE CONDICION');
            res.body.data[0].image.should.be.equal('http://lorempixel.com/135/180/');
            should.exist(res.body.data[0].seller);
            res.body.data[0].seller.should.be.an('object');
            res.body.data[0].seller.name.should.be.equal("Juan Perez");
            res.body.data[0].seller.city.should.be.equal("Córdoba");
            done();
          });
      });
      it('get transform data with regex', function(done){
        chai.request(server)
          .post('/')
          .send({ 
            "url": url2,
            "recipe": {
              "title":"div.items-info h3",
              "image":"figure.items-image img@data-original",
              "price":"p.items-price",
              "permalink":"a@href",
              "seller":{
                  "name": "a.seller p:nth-child(1)",
                  "city": "a.seller p:last-child"
              }
            },
            "paginate": "footer section#pagination a.next@href",
            "selector": "ul li.item",
            "limit": 1,
            "regex": {
                "price":"(\\d+,?\\d*\\.?\\d*)",
                "seller.name":"Vendedor: (.+)",
                "seller.city":"Ciudad: (.+)"
            },
            "charset": "iso-8859-15"
        })
        .end(function(err,res){
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.an('object');
            res.body.data.should.be.an('array');
            res.body.data.length.should.be.equal(3);
            res.body.data[0].title.should.be.equal("IPAD MINI 16gb SILVER IMPECABLE CONDICION");
            res.body.data[0].image.should.be.equal("http://lorempixel.com/135/180/");
            res.body.data[0].price.should.be.equal("3.500");
            res.body.data[0].seller.should.exist;
            res.body.data[0].seller.should.be.an('object');
            res.body.data[0].seller.name.should.be.equal("Juan Perez");
            res.body.data[0].seller.city.should.be.equal("Códoba");
            done();        
        });
      });
      it('not get ajax data without wait', function(done){
        chai.request(server)
          .post('/')
          .send({ 
            "url": dynamic_url,
            "recipe": {
              "title":"div.items-info h3",
              "image":"figure.items-image img@data-original",
              "price":"p.items-price",
              "permalink":"a@href",
              "seller":{
                  "name": "a.seller p:nth-child(1)",
                  "city": "a.seller p:last-child"
              }
            },
            "paginate": "footer section#pagination a.next@href",
            "selector": "ul.dynamic-list li.item",
            "limit": 1,
            "regex": {
                "price":"(\\d+,?\\d*\\.?\\d*)",
                "seller.name":"Vendedor: (.+)",
                "seller.city":"Ciudad: (.+)"
            }
        })
        .end(function(err,res){
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.an('object');
            res.body.data.should.be.an('array');
            res.body.data.length.should.be.equal(0);
            done();        
        });        
      });
      it.only('get ajax data', function(done){
        chai.request(server)
          .post('/')
          .send({ 
            "url": dynamic_url,
            "recipe": {
              "title":"div.items-info h3",
              "image":"figure.items-image img@data-original",
              "price":"p.items-price",
              "permalink":"a@href",
              "seller":{
                  "name": "a.seller p:nth-child(1)",
                  "city": "a.seller p:last-child"
              }
            },
            "paginate": "footer section#pagination a.next@href",
            "selector": "ul.dynamic-list li.item",
            "limit": 1,
            "wait": 1,
            "nightmare": 'http://nightmarelb.demo.pulpou.ujo.website:8889/source',
            "regex": {
                "price":"(\\d+,?\\d*\\.?\\d*)",
                "seller.name":"Vendedor: (.+)",
                "seller.city":"Ciudad: (.+)"
            }
        })
        .end(function(err,res){
            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.an('object');
            res.body.data.should.be.an('array');
            res.body.data.length.should.be.equal(3);
            done();        
        });        
      });
      it('get data from XML document');
    });
  });
})