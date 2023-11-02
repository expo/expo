"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = void 0;
const metro_transform_worker_1 = __importDefault(require("metro-transform-worker"));
const css_1 = require("./css");
const css_modules_1 = require("./css-modules");
const postcss_1 = require("./postcss");
const sass_1 = require("./sass");
const env_1 = require("../env");
const countLines = require('metro/src/lib/countLines');
async function transform(config, projectRoot, filename, data, options) {
    const nextConfig = {
        ...config,
    };
    const nextOptions = {
        ...options,
    };
    // Preserve the original format as much as we can for tree-shaking.
    if (env_1.env.EXPO_USE_TREE_SHAKING && !nextOptions.dev) {
        nextConfig.unstable_disableModuleWrapping = true;
        nextOptions.experimentalImportSupport = false;
        nextOptions.minify = false;
    }
    const isCss = nextOptions.type !== 'asset' && /\.(s?css|sass)$/.test(filename);
    // If the file is not CSS, then use the default behavior.
    if (!isCss) {
        const environment = nextOptions.customTransformOptions?.environment;
        if (environment !== 'node' &&
            // TODO: Ensure this works with windows.
            (filename.match(new RegExp(`^app/\\+html(\\.${nextOptions.platform})?\\.([tj]sx?|[cm]js)?$`)) ||
                // Strip +api files.
                filename.match(/\+api(\.(native|ios|android|web))?\.[tj]sx?$/))) {
            // Remove the server-only +html file and API Routes from the bundle when bundling for a client environment.
            return metro_transform_worker_1.default.transform(nextConfig, projectRoot, filename, !nextOptions.minify
                ? Buffer.from(
                // Use a string so this notice is visible in the bundle if the user is
                // looking for it.
                '"> The server-only file was removed from the client JS bundle by Expo CLI."')
                : Buffer.from(''), nextOptions);
        }
        if (environment !== 'node' &&
            !filename.match(/\/node_modules\//) &&
            filename.match(/\+api(\.(native|ios|android|web))?\.[tj]sx?$/)) {
            // Clear the contents of +api files when bundling for the client.
            // This ensures that the client doesn't accidentally use the server-only +api files.
            return metro_transform_worker_1.default.transform(nextConfig, projectRoot, filename, Buffer.from(''), nextOptions);
        }
        return metro_transform_worker_1.default.transform(nextConfig, projectRoot, filename, data, nextOptions);
    }
    // If the platform is not web, then return an empty module.
    if (nextOptions.platform !== 'web') {
        const code = (0, css_modules_1.matchCssModule)(filename) ? 'module.exports={ unstable_styles: {} };' : '';
        return metro_transform_worker_1.default.transform(nextConfig, projectRoot, filename, 
        // TODO: Native CSS Modules
        Buffer.from(code), nextOptions);
    }
    let code = data.toString('utf8');
    // Apply postcss transforms
    code = await (0, postcss_1.transformPostCssModule)(projectRoot, {
        src: code,
        filename,
    });
    // TODO: When native has CSS support, this will need to move higher up.
    const syntax = (0, sass_1.matchSass)(filename);
    if (syntax) {
        code = (0, sass_1.compileSass)(projectRoot, { filename, src: code }, { syntax }).src;
    }
    // If the file is a CSS Module, then transform it to a JS module
    // in development and a static CSS file in production.
    if ((0, css_modules_1.matchCssModule)(filename)) {
        const results = await (0, css_modules_1.transformCssModuleWeb)({
            filename,
            src: code,
            options: {
                projectRoot,
                dev: nextOptions.dev,
                minify: nextOptions.minify,
                sourceMap: false,
            },
        });
        const jsModuleResults = await metro_transform_worker_1.default.transform(nextConfig, projectRoot, filename, Buffer.from(results.output), nextOptions);
        const cssCode = results.css.toString();
        const output = [
            {
                type: 'js/module',
                data: {
                    // @ts-expect-error
                    ...jsModuleResults.output[0]?.data,
                    // Append additional css metadata for static extraction.
                    css: {
                        code: cssCode,
                        lineCount: countLines(cssCode),
                        map: [],
                        functionMap: null,
                    },
                },
            },
        ];
        return {
            dependencies: jsModuleResults.dependencies,
            output,
        };
    }
    // Global CSS:
    const { transform } = require('lightningcss');
    // TODO: Add bundling to resolve imports
    // https://lightningcss.dev/bundling.html#bundling-order
    const cssResults = transform({
        filename,
        code: Buffer.from(code),
        sourceMap: false,
        cssModules: false,
        projectRoot,
        minify: nextOptions.minify,
    });
    // TODO: Warnings:
    // cssResults.warnings.forEach((warning) => {
    // });
    // Create a mock JS module that exports an empty object,
    // this ensures Metro dependency graph is correct.
    const jsModuleResults = await metro_transform_worker_1.default.transform(nextConfig, projectRoot, filename, nextOptions.dev ? Buffer.from((0, css_1.wrapDevelopmentCSS)({ src: code, filename })) : Buffer.from(''), nextOptions);
    const cssCode = cssResults.code.toString();
    // In production, we export the CSS as a string and use a special type to prevent
    // it from being included in the JS bundle. We'll extract the CSS like an asset later
    // and append it to the HTML bundle.
    const output = [
        {
            type: 'js/module',
            data: {
                // @ts-expect-error
                ...jsModuleResults.output[0]?.data,
                // Append additional css metadata for static extraction.
                css: {
                    code: cssCode,
                    lineCount: countLines(cssCode),
                    map: [],
                    functionMap: null,
                },
            },
        },
    ];
    return {
        dependencies: jsModuleResults.dependencies,
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
    ...metro_transform_worker_1.default,
    transform,
};
