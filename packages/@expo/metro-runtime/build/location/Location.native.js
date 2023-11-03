"use strict";
// Copyright © 2023 650 Industries.
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
exports.install = exports.setLocationHref = void 0;
class DOMException extends Error {
    constructor(message, name) {
        super(message);
        this.name = name;
    }
}
// The differences between the definitions of `Location` and `WorkerLocation`
// are because of the `LegacyUnforgeable` attribute only specified upon
// `Location`'s properties. See:
// - https://html.spec.whatwg.org/multipage/history.html#the-location-interface
// - https://heycam.github.io/webidl/#LegacyUnforgeable
class Location {
    constructor(href = null) {
        const url = new URL(
        // @ts-expect-error
        href);
        url.username = '';
        url.password = '';
        Object.defineProperties(this, {
            hash: {
                get() {
                    return url.hash;
                },
                set() {
                    throw new DOMException(`Cannot set "location.hash".`, 'NotSupportedError');
                },
                enumerable: true,
            },
            host: {
                get() {
                    return url.host;
                },
                set() {
                    throw new DOMException(`Cannot set "location.host".`, 'NotSupportedError');
                },
                enumerable: true,
            },
            hostname: {
                get() {
                    return url.hostname;
                },
                set() {
                    throw new DOMException(`Cannot set "location.hostname".`, 'NotSupportedError');
                },
                enumerable: true,
            },
            href: {
                get() {
                    return url.href;
                },
                set() {
                    throw new DOMException(`Cannot set "location.href".`, 'NotSupportedError');
                },
                enumerable: true,
            },
            origin: {
                get() {
                    return url.origin;
                },
                enumerable: true,
            },
            pathname: {
                get() {
                    return url.pathname;
                },
                set() {
                    throw new DOMException(`Cannot set "location.pathname".`, 'NotSupportedError');
                },
                enumerable: true,
            },
            port: {
                get() {
                    return url.port;
                },
                set() {
                    throw new DOMException(`Cannot set "location.port".`, 'NotSupportedError');
                },
                enumerable: true,
            },
            protocol: {
                get() {
                    return url.protocol;
                },
                set() {
                    throw new DOMException(`Cannot set "location.protocol".`, 'NotSupportedError');
                },
                enumerable: true,
            },
            search: {
                get() {
                    return url.search;
                },
                set() {
                    throw new DOMException(`Cannot set "location.search".`, 'NotSupportedError');
                },
                enumerable: true,
            },
            ancestorOrigins: {
                get() {
                    return {
                        length: 0,
                        item: () => null,
                        contains: () => false,
                    };
                },
                enumerable: true,
            },
            assign: {
                value: function assign() {
                    throw new DOMException(`Cannot call "location.assign()".`, 'NotSupportedError');
                },
                enumerable: true,
            },
            reload: {
                value: function reload() {
                    if (process.env.NODE_ENV !== 'production') {
                        // NOTE: This does change how native fast refresh works. The upstream metro-runtime will check
                        // if `location.reload` exists before falling back on an implementation that is nearly identical to
                        // this. The main difference is that on iOS there is a "reason" message sent, but at the time of writing
                        // this, that message is unused (ref: `RCTTriggerReloadCommandNotification`).
                        const DevSettings = require('react-native')
                            .DevSettings;
                        return DevSettings.reload();
                    }
                    else {
                        throw new DOMException(`Cannot call "location.reload()".`, 'NotSupportedError');
                    }
                },
                enumerable: true,
            },
            replace: {
                value: function replace() {
                    throw new DOMException(`Cannot call "location.replace()".`, 'NotSupportedError');
                },
                enumerable: true,
            },
            toString: {
                value: function toString() {
                    return url.href;
                },
                enumerable: true,
            },
            [Symbol.for('Expo.privateCustomInspect')]: {
                value(inspect) {
                    const object = {
                        hash: this.hash,
                        host: this.host,
                        hostname: this.hostname,
                        href: this.href,
                        origin: this.origin,
                        pathname: this.pathname,
                        port: this.port,
                        protocol: this.protocol,
                        search: this.search,
                    };
                    return `${this.constructor.name} ${inspect(object)}`;
                },
            },
        });
    }
}
Object.defineProperties(Location.prototype, {
    [Symbol.toString()]: {
        value: 'Location',
        configurable: true,
    },
});
let location = undefined;
function setLocationHref(href) {
    location = new Location(href);
}
exports.setLocationHref = setLocationHref;
function install() {
    Object.defineProperty(global, 'Location', {
        value: Location,
        configurable: true,
        writable: true,
    });
    Object.defineProperty(window, 'location', {
        get() {
            return location;
        },
        set() {
            throw new DOMException(`Cannot set "location".`, 'NotSupportedError');
        },
        enumerable: true,
    });
}
exports.install = install;
//# sourceMappingURL=Location.native.js.map