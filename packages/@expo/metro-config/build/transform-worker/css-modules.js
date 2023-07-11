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
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchCssModule = exports.convertLightningCssToReactNativeWebStyleSheet = exports.transformCssModuleWeb = void 0;
const css_1 = require("./css");
const RNW_CSS_CLASS_ID = '_';
async function transformCssModuleWeb(props) {
    const { transform } = await Promise.resolve().then(() => __importStar(require('lightningcss')));
    // TODO: Add bundling to resolve imports
    // https://lightningcss.dev/bundling.html#bundling-order
    const cssResults = transform({
        filename: props.filename,
        code: Buffer.from(props.src),
        sourceMap: props.options.sourceMap,
        cssModules: {
            // Prevent renaming CSS variables to ensure
            // variables created in global files are available.
            dashedIdents: false,
        },
        // cssModules: true,
        projectRoot: props.options.projectRoot,
        minify: props.options.minify,
    });
    const codeAsString = cssResults.code.toString();
    const { styles, reactNativeWeb, variables } = convertLightningCssToReactNativeWebStyleSheet(cssResults.exports);
    let outputModule = `module.exports=Object.assign(${JSON.stringify(styles)},{unstable_styles:${JSON.stringify(reactNativeWeb)}},${JSON.stringify(variables)});`;
    if (props.options.dev) {
        const runtimeCss = (0, css_1.wrapDevelopmentCSS)({
            ...props,
            src: codeAsString,
        });
        outputModule += '\n' + runtimeCss;
    }
    return {
        output: outputModule,
        css: cssResults.code,
        map: cssResults.map,
    };
}
exports.transformCssModuleWeb = transformCssModuleWeb;
function convertLightningCssToReactNativeWebStyleSheet(input) {
    const styles = {};
    const reactNativeWeb = {};
    const variables = {};
    // e.g. { container: { name: 'ahs8IW_container', composes: [], isReferenced: false }, }
    Object.entries(input).map(([key, value]) => {
        // order matters here
        let className = value.name;
        if (value.composes.length) {
            className += ' ' + value.composes.map((value) => value.name).join(' ');
        }
        // CSS Variables will be `{string: string}`
        if (key.startsWith('--')) {
            variables[key] = className;
        }
        styles[key] = className;
        reactNativeWeb[key] = { $$css: true, [RNW_CSS_CLASS_ID]: className };
        return {
            [key]: { $$css: true, [RNW_CSS_CLASS_ID]: className },
        };
    });
    return { styles, reactNativeWeb, variables };
}
exports.convertLightningCssToReactNativeWebStyleSheet = convertLightningCssToReactNativeWebStyleSheet;
function matchCssModule(filePath) {
    return !!/\.module(\.(native|ios|android|web))?\.(css|s[ac]ss)$/.test(filePath);
}
exports.matchCssModule = matchCssModule;
