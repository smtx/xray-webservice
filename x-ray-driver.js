var charset = require('superagent-charset');
var request = require('superagent');
var superagent = charset(request);

module.exports = driver

function driver(enc, opts) {
  var agent = superagent.agent(opts || {})

  return function http_driver(ctx, fn) {
    agent
      .get(ctx.url)
      .charset(enc)
      .set(ctx.headers)
      .end(function(err, res) {
        if (err && !err.status) return fn(err)

        ctx.status = res.status
        ctx.set(res.headers)

        ctx.body = 'application/json' == ctx.type
          ? res.body
          : res.text

        // update the URL if there were redirects
        ctx.url = res.redirects.length
          ? res.redirects.pop()
          : ctx.url

        return fn(null, ctx)
      })
  }
}