"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInjectedCssAsNodes = createInjectedCssAsNodes;
exports.createInjectedScriptAsNodes = createInjectedScriptAsNodes;
exports.getBootstrapContents = getBootstrapContents;
exports.createInjectedFontsAsNodes = createInjectedFontsAsNodes;
const jsx_runtime_1 = require("react/jsx-runtime");
const html_1 = require("./html");
function createInjectedCssAsNodes(hrefs) {
    return {
        headNodes: hrefs.flatMap((href) => [
            (0, jsx_runtime_1.jsx)("link", { rel: "preload", href: href, as: "style" }, `css-preload-${href}`),
            (0, jsx_runtime_1.jsx)("link", { rel: "stylesheet", href: href }, `css-stylesheet-${href}`),
        ]),
    };
}
function createInjectedScriptAsNodes(srcs) {
    return {
        headNodes: srcs.map((src) => ((0, jsx_runtime_1.jsx)("link", { rel: "preload", href: src, as: "script" }, `script-preload-${src}`))),
        bodyNodes: srcs.map((src) => (0, jsx_runtime_1.jsx)("script", { defer: true, src: src }, `script-src-${src}`)),
    };
}
function getBootstrapContents({ hydrate = true, loadedData, }) {
    const parts = [];
    if (hydrate) {
        parts.push((0, html_1.getHydrationFlagScriptContents)());
    }
    if (loadedData) {
        parts.push((0, html_1.getLoaderDataScriptContents)(loadedData));
    }
    return parts.join('\n');
}
function createInjectedFontsAsNodes(descriptors) {
    return descriptors.map((descriptor) => {
        switch (descriptor.type) {
            case 'style':
                return ((0, jsx_runtime_1.jsx)("style", { id: descriptor.id, dangerouslySetInnerHTML: { __html: descriptor.css } }, `font-style-${descriptor.id}`));
            case 'link':
                return ((0, jsx_runtime_1.jsx)("link", { rel: descriptor.rel, href: descriptor.href, as: descriptor.as, crossOrigin: descriptor.crossOrigin }, `font-link-${descriptor.href}`));
            default:
                return null;
        }
    });
}
//# sourceMappingURL=react.js.map