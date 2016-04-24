
var url       = 'http://smtx.github.io/tests/xray/static.html';
var url2      = 'http://smtx.github.io/tests/xray/static.iso8859.html';

var chai      = require('chai');
var chaiHttp  = require('chai-http');
var server    = require('../index');
var should    = chai.should();

chai.use(chaiHttp);

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
describe('Valid JSON recipes', function() {
  describe('Get single data', function() {
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
    it('get data with correct encoding', function(done){
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
  });
  describe('get array data', function(){
    it('get data as array');
    it('get some data');
    it('get transform data with regex');
    it('get ajax data');
    it('get transform ajax data with regex');
    it('get data with correct encoding');
    it('get data from XML document');
  });
});