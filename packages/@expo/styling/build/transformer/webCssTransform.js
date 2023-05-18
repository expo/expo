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
exports.webCssTransform = void 0;
const metro_transform_worker_1 = __importDefault(require("metro-transform-worker"));
const css_1 = require("./css");
const css_modules_1 = require("./css-modules");
// import { compileSass, matchSass } from "./sass";
const countLines = require("metro/src/lib/countLines");
async function webCssTransform(config, projectRoot, filename, data, options) {
    const code = data.toString("utf8");
    // Apply postcss transforms
    // code = await transformPostCssModule(projectRoot, {
    //   src: code,
    //   filename,
    // });
    // TODO: When native has CSS support, this will need to move higher up.
    // const syntax = matchSass(filename);
    // if (syntax) {
    //   code = compileSass(projectRoot, { filename, src: code }, { syntax }).src;
    // }
    // If the file is a CSS Module, then transform it to a JS module
    // in development and a static CSS file in production.
    if ((0, css_modules_1.matchCssModule)(filename)) {
        const results = await (0, css_modules_1.transformCssModuleWeb)({
            filename,
            src: code,
            options: {
                projectRoot,
                dev: options.dev,
                minify: options.minify,
                sourceMap: false,
            },
        });
        if (options.dev) {
            // Dev has the CSS appended to the JS file.
            return metro_transform_worker_1.default.transform(config, projectRoot, filename, Buffer.from(results.output), options);
        }
        const jsModuleResults = await metro_transform_worker_1.default.transform(config, projectRoot, filename, Buffer.from(results.output), options);
        const cssCode = results.css.toString();
        const output = [
            {
                type: "js/module",
                data: {
                    ...jsModuleResults.output[0].data,
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
    if (options.dev) {
        return metro_transform_worker_1.default.transform(config, projectRoot, filename, 
        // In development, we use a JS file that appends a style tag to the
        // document. This is necessary because we need to replace the style tag
        // when the CSS changes.
        // NOTE: We may change this to better support static rendering in the future.
        Buffer.from((0, css_1.wrapDevelopmentCSS)({ src: code, filename })), options);
    }
    const { transform } = await Promise.resolve().then(() => __importStar(require("lightningcss")));
    // TODO: Add bundling to resolve imports
    // https://lightningcss.dev/bundling.html#bundling-order
    const cssResults = transform({
        filename,
        code: Buffer.from(code),
        sourceMap: false,
        cssModules: false,
        projectRoot,
        minify: options.minify,
    });
    // TODO: Warnings:
    // cssResults.warnings.forEach((warning) => {
    // });
    // Create a mock JS module that exports an empty object,
    // this ensures Metro dependency graph is correct.
    const jsModuleResults = await metro_transform_worker_1.default.transform(config, projectRoot, filename, Buffer.from(""), options);
    const cssCode = cssResults.code.toString();
    // In production, we export the CSS as a string and use a special type to prevent
    // it from being included in the JS bundle. We'll extract the CSS like an asset later
    // and append it to the HTML bundle.
    const output = [
        {
            data: {
                ...jsModuleResults.output[0].data,
                // Append additional css metadata for static extraction.
                css: {
                    code: cssCode,
                    lineCount: countLines(cssCode),
                    map: [],
                    functionMap: null,
                },
            },
            type: "js/module",
        },
    ];
    return {
        dependencies: jsModuleResults.dependencies,
        output,
    };
}
exports.webCssTransform = webCssTransform;
//# sourceMappingURL=webCssTransform.js.map