"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
const loose = true;
/** Preset used for DOM components (more restrictive with many legacy transforms) */
module.exports = function (_api, _options) {
    return {
        comments: false,
        compact: true,
        // These plugins are required to support the older JavaScript environment of Android factory WebViews.
        // For example Android 9 and Chromium 66.
        plugins: [
            [require('@babel/plugin-transform-block-scoping')],
            [require('@babel/plugin-transform-class-properties'), { loose }],
            [require('@babel/plugin-transform-class-static-block'), { loose }],
            [require('@babel/plugin-transform-classes')],
            [require('@babel/plugin-transform-private-methods'), { loose }],
            [require('@babel/plugin-transform-private-property-in-object'), { loose }],
            [require('@babel/plugin-transform-unicode-regex')],
            [require('@babel/plugin-transform-named-capturing-groups-regex')],
            [require('@babel/plugin-transform-destructuring'), { useBuiltIns: true }],
            [require('@babel/plugin-transform-async-generator-functions')],
            [require('@babel/plugin-transform-async-to-generator')],
            [require('@babel/plugin-transform-for-of')],
            [require('@babel/plugin-transform-parameters')],
            [require('@babel/plugin-transform-react-display-name')],
            [require('@babel/plugin-transform-optional-catch-binding')],
            [require('@babel/plugin-transform-optional-chaining'), { loose: true }],
            [require('@babel/plugin-transform-nullish-coalescing-operator'), { loose: true }],
            [require('@babel/plugin-transform-logical-assignment-operators'), { loose: true }],
        ],
    };
};
//# sourceMappingURL=webview.js.map