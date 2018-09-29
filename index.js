'use strict';

module.exports = HttpHash;

function HttpHash() {
    if (!(this instanceof HttpHash)) {
        return new HttpHash();
    }

    this._hash = new RouteNode();
}

HttpHash.prototype.get = get;
HttpHash.prototype.set = set;

function get(pathname) {
    var pathSegments = pathname.split('/');

    var hash = this._hash;
    var parentNode = hash;
    var splat = null;
    var params = {};
    var variablePaths;
    var i = 0;

    for (; i < pathSegments.length; i++) {
        var segment = pathSegments[i];

        if (!segment && !hash.isSplat) {
            continue;
        } else if (
            segment === '__proto__' &&
            hash.hasOwnProperty('proto')
        ) {
            hash = hash.proto;
        } else if (hash.staticPaths.hasOwnProperty(segment)) {
            parentNode = hash;
            hash = hash.staticPaths[segment];
        } else if ((variablePaths = hash.variablePaths)) {
            if (variablePaths.isSplat) {
                splat = pathSegments.slice(i).join('/');
                parentNode = hash;
                hash = variablePaths;
                break;
            } else {
                params[variablePaths.segment] = segment;
                parentNode = hash;
                hash = variablePaths;
            }
        } else {
            hash = null;
            break;
        }
    }

    // backtrace
    while (hash === null && parentNode && i >= 0) {
        var parentVp = parentNode.variablePaths;
        i -= 1;
        if (parentVp && parentVp.isSplat) {
            splat = pathSegments.slice(i).join('/');
            hash = parentVp;
            break;
        } else {
            parentNode = parentNode.parent;
        }
    }

    // Match the empty splat
    if (hash &&
        hash.handler === null &&
        hash.variablePaths &&
        hash.variablePaths.isSplat
    ) {
        splat = '';
        hash = hash.variablePaths;
    }

    return new RouteResult(hash, params, splat);
}

function set(pathname, handler) {
    var pathSegments = pathname.split('/');
    var hash = this._hash;
    var lastIndex = pathSegments.length - 1;
    var splatIndex = pathname.indexOf('*');
    var hasSplat = splatIndex >= 0;

    if (hasSplat && splatIndex !== pathname.length - 1) {
        throw SplatError(pathname);
    }

    for (var i = 0; i < pathSegments.length; i++) {
        var segment = pathSegments[i];

        if (!segment) {
            continue;
        }

        if (hasSplat && i === lastIndex) {
            hash = (
                hash.variablePaths ||
                (hash.variablePaths = new RouteNode(hash, segment, true))
            );

            if (!hash.isSplat) {
                throw RouteConflictError(pathname, hash);
            }
        } else if (segment.indexOf(':') === 0) {
            segment = segment.slice(1);
            hash = (
                hash.variablePaths ||
                (hash.variablePaths = new RouteNode(hash, segment))
            );

            if (hash.segment !== segment || hash.isSplat) {
                throw RouteConflictError(pathname, hash);
            }
        } else if (segment === '__proto__') {
            hash = (
                (
                    hash.hasOwnProperty('proto') &&
                    hash.proto
                ) ||
                (hash.proto = new RouteNode(hash, segment))
            );
        } else {
            hash = (
                (
                    hash.staticPaths.hasOwnProperty(segment) &&
                    hash.staticPaths[segment]
                ) ||
                (hash.staticPaths[segment] = new RouteNode(hash, segment))
            );
        }
    }

    if (hash.handler === null) {
        hash.src = pathname;
        hash.handler = handler;
    } else {
        throwRouteConflictError(pathname, hash);
    }
}

function RouteNode(parent, segment, isSplat) {
    this.parent = parent || null;
    this.segment = segment || null;
    this.handler = null;
    this.staticPaths = {};
    this.variablePaths = null;
    this.isSplat = !!isSplat;
    this.src = null;
}

function RouteResult(node, params, splat) {
    this.handler = node && node.handler || null;
    this.splat = splat;
    this.params = params;
    this.src = node && node.src || null;
}

function SplatError(pathname) {
    var err = new Error('The splat * must be the last segment of the path');
    err.pathname = pathname;
    return err;
}

function RouteConflictError(pathname, hash) {
    var conflictPath = hash.isSplat ? '' : '/';

    while (hash && hash.parent) {
        var prefix = (
            !hash.isSplat &&
            hash === hash.parent.variablePaths
        ) ? ':' : '';

        conflictPath = '/' + prefix + hash.segment + conflictPath;

        hash = hash.parent;
    }

    var err = new Error('Route conflict');
    err.attemptedPath = pathname;
    err.conflictPath = conflictPath;

    return err;
}

// Break this out to prevent deoptimization of path.set
function throwRouteConflictError(pathname, hash) {
    throw RouteConflictError(pathname, hash);
}
