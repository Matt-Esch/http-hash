# http-hash

[![build status][build-png]][build]
[![Coverage Status][cover-png]][cover]
[![Davis Dependency status][dep-png]][dep]


[![NPM][npm-png]][npm]

<!-- [![browser support][test-png]][test] -->

HTTP router based on a strict path tree structure

## Example 1 : Basic routes

```js
var HttpHash = require('http-hash');

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
    handler: function (req, res) {},
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

```

## Example 2 : Trailing splats

```js
var HttpHash = require('http-hash');

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
```

## Overview

The most popular node routers are based on regular expression
mathching. This means that the order in which the routes are
defined affects the resolution of a route to handler. Sometimes
this is desirable, but it would often be better to have a
resolution scheme that is easier to reason about.

`http-hash` solves the routing problem by making route resolution
independent of the order in which routes are defined. It does so
by breaking a path into a tree of nodes, based on a simple split
on `/`. For example, the route `/foo/bar/baz` is treated as tree
nodes `foo > bar > baz`. We call `foo`, `bar` and `baz` path
segments.

Theses path segments are arranged into a tree of nodes, where
each segment defines a node in the tree. Each node can point to:

 - a fixed handler `node.handler`, otherwise known as the node
   value

 - a set of static paths indexed by path name `node.staticPaths`

 - a variable subtree `node.variablePaths`, that can match a
   single named parameter OR the remainder of a route (splat).


If the last character of a defined route is `*`, a variable path
(or splat) will be inserted, consuming the rest of the path.
This allows for subrouting, i.e. if you want to mount a static
filesystem on `/fs` you would set the path as `/fs/*` where
the nodes are broken down into the tree `fs > *`. The remainder
of the route will be returned as a "splat" value, allowing for
further routing.

In the simple case, the route tree is based on exact matches on
the name of the segment. That is to say, for the case where we
want to match `/foo/bar/baz`, the tree looks like

```js
{
  staticPaths: {
    foo: {
      staticPaths: {
        bar: {
          staticPaths: {
            baz: {
              handler: function (req, res) {}
            }
          }
        }
      }
    }
  }
}
```

When defining routes, variable paths may be specified. This is
where path segments are prefixed with `:` i.e. `/foo/:bar/baz`.

For the `:bar` segment, the route consumes the single variable
route slot for that node in the tree. So for example, the route
`/foo/:bar/baz looks like

```js
{
  staticPaths: {
    foo: {
      variablePaths: {
        staticPaths: {
          'baz': function (req, res) {}
        }
      }
    }
  }
}
```

Since a node can have both static and dynamic paths associated
with it, the static path will win over the variable path when we
resolve the path.

### Trailing slashes

In most cases the trailing / does not matter. Variables cannot be
the empty string, and neither can splats. A splat value will not
contain the leading slash as it is consumed by the parent node.

### Path conflicts

If a path conflict occurs, an exception will be thrown. Conflicts
occur when:

 - A route is defined twice, resolving to two handlers

This is the simplest case where `/foo` has been defined twice.


 - Variable names in the path are different

Note that `/foo/:vara/` and `/foo/:varb/` conflict, since they
both resolve to `foo.variablePaths`, but have different param
names.


 - A variable route is defined for a splat node

In the case of splats being defined at a level, no other
other variables may be specified, as we cannot distinguish
between `/foo/:var` and `/foo/*`. It is however ok to put static
paths on the same level, i.e. `/foo/bar` and `/foo/*`. In this
case, the static paths will be tried first before yielding the
splat.


## Docs

### `var hash = HttpHash()`

```ocaml
http-hash := () => HttpHash

type HttpHash := {
    get: (String: url) => RouteResult,
    set: (String: path, Any: handler) => void,
    _hash: RouteNode
}

type RouteNode := {
    handler: Any,
    fixedPaths: Object<String, RouteNode>,
    variablePaths: RouteNode | null
}

type RouteResult := {
    handler: Any | null,
    params: Object<String, String>,
    splat: String | null
}
```

`http-hash` exports a safe constructor function that when called
returns a new `HttpHash`. `get` and `set` methods are exposed for
public consumption and the underlying data structure `_hash` is
exposed for private inspection/internal use.

### `hash.set(path, handler)`

```ocaml
hash.set := (String: path, Any: handler) => void
```

Puts a path  in the route table. If the path conflicts with an
existing path, an exception will be thrown.

Routes containing a `*` that are not part of a `/*` prefix will
also throw an exception.

A path should look like `/` or `/foo` or `/:foo` or a union of
theses things, or optionally end with `/*`

- param names should not be repeated as they will conflict but
  there is no strong assertion for this. The last param name
  wins.

- specifying a variable twice for a node will cause an exception

- repeated and trailing '/' are ignored

- paths are case sensitive

- variables and splats are not matched by the empty string.


### `hash.get(path)`

```ocaml
hash.get := (String: path) => RouteResult
```

Gets a route from the route table. If there is no viable route,
the handler will be returned as `null` in the `RouteResult`
object.

The route result contains a `params hash`, containing a key for
each named variable in the path. Additionally, if a splat route
was defined, the `splat` property will contain the tail portion
of the route matched.


## Installation

`npm install http-hash`

## Tests

`npm test`

## Contributors

 - Matt Esch

## MIT Licensed

  [build-png]: https://secure.travis-ci.org/Matt-Esch/http-hash.png
  [build]: https://travis-ci.org/Matt-Esch/http-hash
  [cover-png]: https://coveralls.io/repos/Matt-Esch/http-hash/badge.png?branch=master
  [cover]: https://coveralls.io/r/Matt-Esch/http-hash
  [dep-png]: https://david-dm.org/Matt-Esch/http-hash.png
  [dep]: https://david-dm.org/Matt-Esch/http-hash
  [test-png]: https://ci.testling.com/Matt-Esch/http-hash.png
  [test]: https://ci.testling.com/Matt-Esch/http-hash
  [npm-png]: https://nodei.co/npm/http-hash.png?stars&downloads
  [npm]: https://nodei.co/npm/http-hash
