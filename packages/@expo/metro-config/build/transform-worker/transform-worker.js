"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = void 0;
/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const countLines_1 = __importDefault(require("metro/src/lib/countLines"));
const css_1 = require("./css");
const css_modules_1 = require("./css-modules");
const worker = __importStar(require("./metro-transform-worker"));
const postcss_1 = require("./postcss");
const sass_1 = require("./sass");
const filePath_1 = require("../utils/filePath");
const debug = require('debug')('expo:metro-config:transform-worker');
function getStringArray(value) {
    if (!value)
        return undefined;
    if (typeof value === 'string') {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        throw new Error('Expected an array of strings for the `clientBoundaries` option.');
    }
    if (Array.isArray(value)) {
        return value;
    }
    throw new Error('Expected an array of strings for the `clientBoundaries` option.');
}
async function transform(config, projectRoot, filename, data, options) {
    const reactServer = options.customTransformOptions?.environment === 'react-server';
    const posixFilename = (0, filePath_1.toPosixPath)(filename);
    if (typeof options.customTransformOptions?.dom === 'string' &&
        posixFilename.match(/expo\/dom\/entry\.js/)) {
        // TODO: Find some method to do this without invalidating the cache between different DOM components.
        // Inject source for DOM component entry.
        const relativeDomComponentEntry = JSON.stringify(decodeURI(options.customTransformOptions.dom));
        const src = `require('expo/dom/internal').registerDOMComponent(require(${relativeDomComponentEntry}).default);`;
        return worker.transform(config, projectRoot, filename, Buffer.from(src), options);
    }
    if (posixFilename.match(/@expo\/metro-runtime\/rsc\/virtual\.js/)) {
        const environment = options.customTransformOptions?.environment;
        const isServer = environment === 'node' || environment === 'react-server';
        if (!isServer) {
            const clientBoundaries = getStringArray(options.customTransformOptions?.clientBoundaries);
            // Inject client boundaries into the root client bundle for production bundling.
            if (clientBoundaries) {
                debug('Parsed client boundaries:', clientBoundaries);
                // Inject source
                const src = 'module.exports = {\n' +
                    clientBoundaries
                        .map((boundary) => {
                        const serializedBoundary = JSON.stringify(boundary);
                        return `[\`$\{require.resolveWeak(${serializedBoundary})}\`]: /* ${boundary} */ () => import(${serializedBoundary}),`;
                    })
                        .join('\n') +
                    '\n};';
                return worker.transform(config, projectRoot, filename, Buffer.from('/* RSC client boundaries */\n' + src), options);
            }
        }
    }
    const isCss = options.type !== 'asset' && /\.(s?css|sass)$/.test(filename);
    // If the file is not CSS, then use the default behavior.
    if (!isCss) {
        const environment = options.customTransformOptions?.environment;
        const isClientEnvironment = environment !== 'node' && environment !== 'react-server';
        if (isClientEnvironment &&
            // TODO: Ensure this works with windows.
            (filename.match(new RegExp(`^app/\\+html(\\.${options.platform})?\\.([tj]sx?|[cm]js)?$`)) ||
                // Strip +api files.
                filename.match(/\+api(\.(native|ios|android|web))?\.[tj]sx?$/))) {
            // Remove the server-only +html file and API Routes from the bundle when bundling for a client environment.
            return worker.transform(config, projectRoot, filename, !options.minify
                ? Buffer.from(
                // Use a string so this notice is visible in the bundle if the user is
                // looking for it.
                '"> The server-only file was removed from the client JS bundle by Expo CLI."')
                : Buffer.from(''), options);
        }
        if (isClientEnvironment &&
            !filename.match(/\/node_modules\//) &&
            filename.match(/\+api(\.(native|ios|android|web))?\.[tj]sx?$/)) {
            // Clear the contents of +api files when bundling for the client.
            // This ensures that the client doesn't accidentally use the server-only +api files.
            return worker.transform(config, projectRoot, filename, Buffer.from(''), options);
        }
        return worker.transform(config, projectRoot, filename, data, options);
    }
    // If the platform is not web, then return an empty module.
    if (options.platform !== 'web') {
        const code = (0, css_modules_1.matchCssModule)(filename) ? 'module.exports={ unstable_styles: {} };' : '';
        return worker.transform(config, projectRoot, filename, 
        // TODO: Native CSS Modules
        Buffer.from(code), options);
    }
    let code = data.toString('utf8');
    // Apply postcss transforms
    const postcssResults = await (0, postcss_1.transformPostCssModule)(projectRoot, {
        src: code,
        filename,
    });
    if (postcssResults.hasPostcss) {
        code = postcssResults.src;
    }
    // TODO: When native has CSS support, this will need to move higher up.
    const syntax = (0, sass_1.matchSass)(filename);
    if (syntax) {
        code = (0, sass_1.compileSass)(projectRoot, { filename, src: code }, { syntax }).src;
    }
    // If the file is a CSS Module, then transform it to a JS module
    // in development and a static CSS file in production.
    if ((0, css_modules_1.matchCssModule)(filename)) {
        const results = await (0, css_modules_1.transformCssModuleWeb)({
            // NOTE(cedric): use POSIX-formatted filename fo rconsistent CSS module class names.
            // This affects the content hashes, which should be stable across platforms.
            filename: posixFilename,
            src: code,
            options: {
                reactServer,
                projectRoot,
                dev: options.dev,
                minify: options.minify,
                sourceMap: false,
            },
        });
        const jsModuleResults = await worker.transform(config, projectRoot, filename, Buffer.from(results.output), options);
        const cssCode = results.css.toString();
        const output = [
            {
                type: 'js/module',
                data: {
                    ...jsModuleResults.output[0]?.data,
                    // Append additional css metadata for static extraction.
                    css: {
                        code: cssCode,
                        lineCount: (0, countLines_1.default)(cssCode),
                        map: [],
                        functionMap: null,
                        // Disable caching for CSS files when postcss is enabled and has been run on the file.
                        // This ensures that things like tailwind can update on every change.
                        skipCache: postcssResults.hasPostcss,
                        externalImports: results.externalImports,
                    },
                },
            },
        ];
        return {
            dependencies: jsModuleResults.dependencies.concat(results.dependencies),
            output,
        };
    }
    // Global CSS:
    const { transform } = require('lightningcss');
    // Here we delegate bundling to lightningcss to resolve all CSS imports together.
    // TODO: Add full CSS bundling support to Metro.
    const cssResults = transform({
        filename,
        code: Buffer.from(code),
        errorRecovery: true,
        sourceMap: false,
        cssModules: false,
        projectRoot,
        minify: options.minify,
        analyzeDependencies: true,
        // @ts-expect-error: Added for testing against virtual file system.
        resolver: options._test_resolveCss,
    });
    (0, css_modules_1.printCssWarnings)(filename, code, cssResults.warnings);
    const cssImports = (0, css_modules_1.collectCssImports)(filename, code, cssResults.code.toString(), cssResults);
    const cssCode = cssImports.code;
    // Append additional css metadata for static extraction.
    const cssOutput = {
        code: cssCode,
        lineCount: (0, countLines_1.default)(cssCode),
        map: [],
        functionMap: null,
        // Disable caching for CSS files when postcss is enabled and has been run on the file.
        // This ensures that things like tailwind can update on every change.
        skipCache: postcssResults.hasPostcss,
        externalImports: cssImports.externalImports,
    };
    // Create a mock JS module that exports an empty object,
    // this ensures Metro dependency graph is correct.
    const jsModuleResults = await worker.transform(config, projectRoot, filename, options.dev
        ? Buffer.from((0, css_1.wrapDevelopmentCSS)({ src: cssCode, filename, reactServer }))
        : Buffer.from(''), options);
    // In production, we export the CSS as a string and use a special type to prevent
    // it from being included in the JS bundle. We'll extract the CSS like an asset later
    // and append it to the HTML bundle.
    const output = [
        {
            type: 'js/module',
            data: {
                ...jsModuleResults.output[0].data,
                css: cssOutput,
            },
        },
    ];
    return {
        dependencies: jsModuleResults.dependencies.concat(cssImports.dependencies),
        output,
    };
}
exports.transform = transform;
/**
 * A custom Metro transformer that adds support for processing Expo-specific bundler features.
 * - Global CSS files on web.
 * - CSS Modules on web.
 * - TODO: Tailwind CSS on web.
 */
module.exports = {
    // Use defaults for everything that's not custom.
    ...worker,
    transform,
};
//# sourceMappingURL=transform-worker.js.map