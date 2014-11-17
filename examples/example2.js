var HttpHash = require('../index');

// Create a new http hash
var hash = HttpHash();

// Create a route mapping to /test/<anything but "/">/<anything>
hash.set('/foo/:test/*', function (req, res) {
    res.end();
});

var route = hash.get('/foo/val/one/two/three');
console.log(route);
/*
-> {
    handler: function (req, res) { ... },
    params: {
        test: 'val'
    },
    splat: 'one/two/three'
}
*/
