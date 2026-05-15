"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
const loose = true;
/** The JS syntax preset used with Hermes v0/legacy (pre SDK 56) */
module.exports = function (_api, _options) {
    return {
        comments: false,
        compact: true,
        plugins: [
            [require('@babel/plugin-transform-block-scoping')],
            [require('@babel/plugin-transform-class-properties'), { loose }],
            [require('@babel/plugin-transform-class-static-block'), { loose }],
            [require('@babel/plugin-transform-private-methods'), { loose }],
            [require('@babel/plugin-transform-private-property-in-object'), { loose }],
            [require('@babel/plugin-transform-unicode-regex')],
            [require('@babel/plugin-transform-classes')],
            [require('@babel/plugin-transform-named-capturing-groups-regex')],
            [require('@babel/plugin-transform-destructuring'), { useBuiltIns: true }],
            [require('@babel/plugin-transform-async-generator-functions')],
            [require('@babel/plugin-transform-async-to-generator')],
            // Ensure the react-jsx-dev plugin works as expected when JSX is used in a function body.
            require('@babel/plugin-transform-parameters'),
            [require('@babel/plugin-transform-react-display-name')],
        ],
    };
};
//# sourceMappingURL=hermes-v0.js.map