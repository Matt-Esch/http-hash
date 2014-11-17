var HttpHash = require('../index.js');

// Create a new http hash
var hash = HttpHash();

// Create a route mapping to /test/<anything but "/">
hash.set('/test/:foo/', function (req, res) {
    res.end();
});

// Get a valid route
var route = hash.get('/test/var');
console.log(route);
/*
-> {
    handler: function (req, res) { ... },
    params: {
        foo: 'var'
    },
    splat: null
}
*/

// Get an invalid route (returns null)
var missing = hash.get('/missing');
console.log(missing);
/*
-> {
    handler: null,
    params: {},
    splat: null
}
*/
