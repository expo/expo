"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
const loose = true;
/** Preset that's used for the Web target */
module.exports = function (_api, _options) {
    return {
        comments: false,
        compact: true,
        plugins: [
            [require('@babel/plugin-transform-class-static-block'), { loose }],
            [require('@babel/plugin-transform-private-methods'), { loose }],
            [require('@babel/plugin-transform-private-property-in-object'), { loose }],
        ],
    };
};
//# sourceMappingURL=web.js.map