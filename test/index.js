'use strict';

var test = require('tape');

var HttpHash = require('../index.js');

test('httpHash is a function', function (assert) {
    assert.equal(typeof HttpHash, 'function');
    assert.end();
});

test('http hash inserts root', function (assert) {
    // Arrange
    function routeHandler() {}

    var hash = HttpHash();

    // Act
    hash.set('/', routeHandler);

    // Assert
    assert.strictEqual(hash._hash.handler, routeHandler);
    assert.end();
});

test('http hash inserts fixed route', function (assert) {
    // Arrange
    function routeHandler() {}

    var hash = HttpHash();

    // Act
    hash.set('/test', routeHandler);

    // Assert
    assert.strictEqual(
        hash._hash.staticPaths.test.handler,
        routeHandler
    );
    assert.end();
});

test('http hash inserts variable route', function (assert) {
    // Arrange
    function routeHandler() {}

    var hash = HttpHash();

    // Act
    hash.set('/:test', routeHandler);

    // Assert
    assert.strictEqual(
        hash._hash.variablePaths.handler,
        routeHandler
    );
    assert.end();
});

test('http hash retrieves root', function (assert) {
    // Arrange
    function routeHandler() {}

    var hash = HttpHash();
    hash.set('/', routeHandler);

    var expectedParams = {};

    // Act
    var result = hash.get('/');

    // Assert
    assert.strictEqual(result.handler, routeHandler);
    assert.strictEqual(result.src, '/');
    assert.strictEqual(result.splat, null);
    assert.deepEqual(result.params, expectedParams);
    assert.end();
});

test('http hash retrieves fixed route', function (assert) {
    // Arrange
    function routeHandler() {}

    var hash = HttpHash();
    hash.set('/test', routeHandler);

    var expectedParams = {};

    // Act
    var result = hash.get('/test');

    // Assert
    assert.strictEqual(result.handler, routeHandler);
    assert.strictEqual(result.src, '/test');
    assert.strictEqual(result.splat, null);
    assert.deepEqual(result.params, expectedParams);
    assert.end();

});

test('http hash retrieves variable route', function (assert) {
    // Arrange
    function routeHandler() {}

    var hash = HttpHash();
    hash.set('/:test', routeHandler);

    var expectedParams = { test: 'hello' };

    // Act
    var result = hash.get('/hello');

    // Assert
    assert.strictEqual(result.handler, routeHandler);
    assert.strictEqual(result.src, '/:test');
    assert.strictEqual(result.splat, null);
    assert.deepEqual(result.params, expectedParams);
    assert.end();
});


test('http hash retrieves null root', function (assert) {
    // Arrange
    var hash = HttpHash();

    // Act
    var rootResult = hash.get('/');
    var staticResult = hash.get('/a');

    // Assert
    assert.strictEqual(rootResult.handler, null);
    assert.strictEqual(staticResult.handler, null);
    assert.end();
});

test('http hash retrieves null static', function (assert) {
    // Arrange
    function routeHandler() {}

    var hash = HttpHash();
    hash.set('/a/b/c', routeHandler);

    // Act
    var rootResult = hash.get('/a/b/');
    var staticResult = hash.get('/a/b/foo');

    // Assert
    assert.strictEqual(staticResult.handler, null);
    assert.strictEqual(rootResult.handler, null);
    assert.end();
});

test('http hash retrieves null variable', function (assert) {
    // Arrange
    function routeHandler() {}

    var hash = HttpHash();
    hash.set('/a/:b/c', routeHandler);

    // Act
    var rootResult = hash.get('/a/b/');
    var staticResult = hash.get('/a/b/foo');

    // Assert
    assert.strictEqual(staticResult.handler, null);
    assert.strictEqual(rootResult.handler, null);
    assert.end();
});

test('conflicting root exception', function (assert) {
    // Arrage
    function routeHandler() {}

    var hash = HttpHash();
    hash.set('/', routeHandler);

    // Act
    var exception;

    try {
        hash.set('/', routeHandler);
    } catch (e) {
        exception = e;
    }

    // Assert
    assert.ok(exception);
    assert.strictEqual(exception.message, 'Route conflict');
    assert.strictEqual(exception.attemptedPath, '/');
    assert.strictEqual(exception.conflictPath, '/');
    assert.end();
});

test('conflicting static route exception', function (assert) {
        // Arrage
    function routeHandler() {}

    var hash = HttpHash();
    hash.set('/test', routeHandler);

    // Act
    var exception;

    try {
        hash.set('/test', routeHandler);
    } catch (e) {
        exception = e;
    }

    // Assert
    assert.ok(exception);
    assert.strictEqual(exception.message, 'Route conflict');
    assert.strictEqual(exception.attemptedPath, '/test');
    assert.strictEqual(exception.conflictPath, '/test/');
    assert.end();
});

test('conflicting variable route exception', function (assert) {
        // Arrage
    function routeHandler() {}

    var hash = HttpHash();
    hash.set('/:test', routeHandler);

    // Act
    var exception;

    try {
        hash.set('/:test', routeHandler);
    } catch (e) {
        exception = e;
    }

    // Assert
    assert.ok(exception);
    assert.strictEqual(exception.message, 'Route conflict');
    assert.strictEqual(exception.message, 'Route conflict');
    assert.strictEqual(exception.attemptedPath, '/:test');
    assert.strictEqual(exception.conflictPath, '/:test/');
    assert.end();
});


test('nesting routes', function (assert) {
    // Arrange
    var hash = HttpHash();

    var firstRoutes = [
        '/',
        '/test',
        '/:test'
    ];

    var secondRoutes = [
        '/',
        '/var',
        '/:var'
    ];

    var conflicts = [];

    for (var i = 0; i < firstRoutes.length; i++) {
        for (var j = 0; j < secondRoutes.length; j++) {
            try {
                hash.set(firstRoutes[i] + secondRoutes[j], i + ',' + j);
            } catch (e) {
                conflicts.push(i + ',' + j);
            }
        }
    }

    // Act
    var results = {};

    for (var k = 0; k < firstRoutes.length; k++) {
        for (var l = 0; l < secondRoutes.length; l++) {
            results[k + ',' + l] = hash.get(firstRoutes[k] + secondRoutes[l]);
        }
    }

    // Assert
    for (var m = 0; m < firstRoutes.length; m++) {
        for (var n = 0; n < secondRoutes.length; n++) {
            var index = m + ',' + n;

            if (conflicts.indexOf(index) >= 0) {
                continue;
            }

            assert.strictEqual(results[index].handler, index);
        }
    }

    // there should be 3 conflicts violation of variable name
    assert.strictEqual(conflicts.length, 3);

    assert.strictEqual(conflicts[0], '2,0');
    assert.strictEqual(conflicts[1], '2,1');
    assert.strictEqual(conflicts[2], '2,2');
    assert.end();
});

test('deep route with splat test', function (assert) {
    // Arrange
    var hash = HttpHash();

    function routeHandler() {}

    hash.set('/a/:varA/b/:varB/c/*', routeHandler);

    var expectedParams = {
        varA: '123456',
        varB: 'testing'
    };

    var expectedSplat = 'kersplat';

    // Act
    var result = hash.get('/a/123456///b///testing/c/kersplat');

    // Assert
    assert.strictEqual(result.src, '/a/:varA/b/:varB/c/*');
    assert.strictEqual(result.handler, routeHandler);
    assert.strictEqual(result.splat, expectedSplat);
    assert.deepEqual(result.params, expectedParams);
    assert.end();
});

test('splat in the middle causes splat error', function (assert) {
    // Arrange
    var hash = HttpHash();

    // Act
    var exception;

    try {
        hash.set('/a/*/b');
    } catch (e) {
        exception = e;
    }

    // Assert
    assert.ok(exception);
    assert.strictEqual(
        exception.message,
        'The splat * must be the last segment of the path'
    );
    assert.strictEqual(exception.pathname, '/a/*/b');
    assert.end();
});

test('static routes work on splat nodes', function (assert) {
    // Arrange
    var hash = HttpHash();
    function splatHandler() {}
    function staticHandler() {}

    hash.set('*', splatHandler);
    hash.set('/static', staticHandler);

    // Act
    var splatResult = hash.get('/testing');
    var staticResult = hash.get('/static');

    // Assert
    assert.strictEqual(splatResult.src, '*');
    assert.strictEqual(splatResult.handler, splatHandler);
    assert.strictEqual(splatResult.splat, 'testing');
    assert.deepEqual(splatResult.params, {});

    assert.strictEqual(staticResult.src, '/static');
    assert.strictEqual(staticResult.handler, staticHandler);
    assert.strictEqual(staticResult.splat, null);
    assert.deepEqual(staticResult.params, {});

    assert.end();
});

test('vairable routes do not work on splat nodes', function (assert) {
    // Arrange
    var hash = HttpHash();

    function splatHandler() {}
    hash.set('*', splatHandler);

    function variableHandler() {}

    // Act
    var exception;

    try {
        hash.set('/:var', variableHandler);
    } catch (e) {
        exception = e;
    }

    // Assert
    assert.ok(exception);
    assert.strictEqual(exception.message, 'Route conflict');
    assert.strictEqual(exception.attemptedPath, '/:var');
    assert.strictEqual(exception.conflictPath, '/*');
    assert.end();
});

test('splat routes do not work on variable nodes', function (assert) {
    // Arrange
    var hash = HttpHash();

    function splatHandler() {}
    hash.set('/:var', splatHandler);

    function variableHandler() {}

    // Act
    var exception;

    try {
        hash.set('*', variableHandler);
    } catch (e) {
        exception = e;
    }

    // Assert
    assert.ok(exception);
    assert.strictEqual(exception.message, 'Route conflict');
    assert.strictEqual(exception.attemptedPath, '*');
    assert.strictEqual(exception.conflictPath, '/:var/');
    assert.end();
});

test('does not conflict with prototype', function (assert) {
    // Arrange
    var hash = HttpHash();

    function validHandler() {}

    hash.set('/toString/valueOf', validHandler);

    // Act
    var toStringResult = hash.get('toString');
    var valueOfResult = hash.get('valueOf');
    var pathResult = hash.get('/toString/valueOf');

    // Assert
    assert.strictEqual(toStringResult.handler, null);
    assert.strictEqual(valueOfResult.handler, null);
    assert.strictEqual(pathResult.handler, validHandler);
    assert.strictEqual(pathResult.src, '/toString/valueOf');
    assert.end();
});

test('does not conflict with __proto__', function (assert) {
    // Arrage
    var hash = HttpHash();

    function validHandler() {}
    function validSubHandler() {}

    hash.set('/__proto__', validHandler);
    hash.set('/__proto__/sub', validSubHandler);

    // Act
    var validResult = hash.get('/__proto__');
    var validSubResult = hash.get('/__proto__/sub');
    var invalidResult = hash.get('/__proto__/__proto__');

    // Assert
    assert.strictEqual(validResult.handler, validHandler);
    assert.strictEqual(validResult.src, '/__proto__');
    assert.strictEqual(validSubResult.handler, validSubHandler);
    assert.strictEqual(validSubResult.src, '/__proto__/sub');
    assert.strictEqual(invalidResult.handler, null);
    assert.end();
});

test('root splat matches all', function (assert) {
    // Arrage
    var hash = HttpHash();

    function validHandler() {}

    hash.set('*', validHandler);

    // Act
    var validEmptyResult = hash.get('');
    var validRootResult = hash.get('/');
    var validNestedResult = hash.get('/a/b/c');

    // Assert
    assert.strictEqual(validEmptyResult.handler, validHandler);
    assert.strictEqual(validRootResult.handler, validHandler);
    assert.strictEqual(validNestedResult.handler, validHandler);
    assert.end();
});
