"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformCssModuleWeb = transformCssModuleWeb;
exports.convertLightningCssToReactNativeWebStyleSheet = convertLightningCssToReactNativeWebStyleSheet;
exports.matchCssModule = matchCssModule;
exports.printCssWarnings = printCssWarnings;
exports.collectCssImports = collectCssImports;
const code_frame_1 = __importDefault(require("@babel/code-frame"));
const browserslist_1 = require("./browserslist");
const css_1 = require("./css");
const RNW_CSS_CLASS_ID = '_';
async function transformCssModuleWeb(props) {
    const { transform } = require('lightningcss');
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
        errorRecovery: true,
        analyzeDependencies: true,
        // cssModules: true,
        projectRoot: props.options.projectRoot,
        minify: props.options.minify,
        // @ts-expect-error: Added for testing against virtual file system.
        resolver: props.options._test_resolveCss,
        targets: await (0, browserslist_1.getBrowserslistTargets)(props.options.projectRoot),
        include: 1, // Nesting
    });
    printCssWarnings(props.filename, props.src, cssResults.warnings);
    const { styles, reactNativeWeb, variables } = convertLightningCssToReactNativeWebStyleSheet(cssResults.exports);
    let outputModule = `module.exports=Object.assign(${JSON.stringify(styles)},{unstable_styles:${JSON.stringify(reactNativeWeb)}},${JSON.stringify(variables)});`;
    const cssImports = collectCssImports(props.filename, props.src, cssResults.code.toString(), cssResults);
    if (props.options.dev) {
        const runtimeCss = (0, css_1.wrapDevelopmentCSS)({
            reactServer: props.options.reactServer,
            filename: props.filename,
            src: cssImports.code,
        });
        outputModule += '\n' + runtimeCss;
    }
    return {
        output: outputModule,
        css: cssImports.code,
        map: cssResults.map,
        ...cssImports,
    };
}
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
function matchCssModule(filePath) {
    return !!/\.module(\.(native|ios|android|web))?\.(css|s[ac]ss)$/.test(filePath);
}
function printCssWarnings(filename, code, warnings) {
    if (warnings) {
        for (const warning of warnings) {
            console.warn(`Warning: ${warning.message} (${filename}:${warning.loc.line}:${warning.loc.column}):\n${(0, code_frame_1.default)(code, warning.loc.line, warning.loc.column)}`);
        }
    }
}
function isExternalUrl(url) {
    return url.match(/^\w+:\/\//);
}
function collectCssImports(filename, originalCode, code, cssResults) {
    const externalImports = [];
    const cssModuleDeps = [];
    if (cssResults.dependencies) {
        for (const dep of cssResults.dependencies) {
            if (dep.type === 'import') {
                // If the URL starts with `http://` or other protocols, we'll treat it like an external import.
                if (isExternalUrl(dep.url)) {
                    externalImports.push({
                        url: dep.url,
                        supports: dep.supports,
                        media: dep.media,
                    });
                }
                else {
                    // If the import is a local file, then add it as a JS dependency so the bundler can resolve it.
                    cssModuleDeps.push({
                        name: dep.url,
                        data: {
                            asyncType: null,
                            isESMImport: false,
                            isOptional: false,
                            locs: [
                                {
                                    start: {
                                        line: dep.loc.start.line,
                                        column: dep.loc.start.column,
                                        index: -1,
                                    },
                                    end: {
                                        line: dep.loc.end.line,
                                        column: dep.loc.end.column,
                                        index: -1,
                                    },
                                    filename,
                                    identifierName: undefined,
                                },
                            ],
                            css: {
                                url: dep.url,
                                media: dep.media,
                                supports: dep.supports,
                            },
                            exportNames: [],
                            key: dep.url,
                        },
                    });
                }
            }
            else if (dep.type === 'url') {
                // Put the URL back into the code.
                code = code.replaceAll(dep.placeholder, dep.url);
                const isSupported = // External URL
                 isExternalUrl(dep.url) ||
                    // Data URL, DOM id, or public file.
                    dep.url.match(/^(data:|[#/])/);
                if (!isSupported) {
                    // Assert that syntax like `background: url('./img.png');` is not supported yet.
                    console.warn(`Importing local resources in CSS is not supported yet. (${filename}:${dep.loc.start.line}:${dep.loc.start.column}):\n${(0, code_frame_1.default)(originalCode, dep.loc.start.line, dep.loc.start.column)}`);
                }
            }
        }
    }
    return { externalImports, code, dependencies: cssModuleDeps };
}
//# sourceMappingURL=css-modules.js.map