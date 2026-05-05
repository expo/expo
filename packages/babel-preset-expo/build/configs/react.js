"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = function (_api, options) {
    const runtime = options.jsxRuntime || 'automatic';
    const plugins = [];
    if (runtime === 'classic' && options.dev) {
        // NOTE(@kitten): runtime 'classic' is typically not needed but preserved for legacy cases (deprecated)
        plugins.push([
            require('@babel/plugin-transform-react-jsx-development'),
            { runtime },
        ]);
    }
    else {
        plugins.push([
            require('@babel/plugin-transform-react-jsx'),
            {
                pure: !options.dev,
                runtime,
                ...(runtime !== 'classic' && {
                    importSource: options.jsxImportSource || 'react',
                }),
            },
        ]);
    }
    if (!options.dev) {
        plugins.push([
            require('@babel/plugin-transform-react-pure-annotations')
        ]);
    }
    return {
        comments: false,
        compact: true,
        plugins,
    };
};
//# sourceMappingURL=react.js.map