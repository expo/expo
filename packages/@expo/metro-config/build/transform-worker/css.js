"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathToHtmlSafeName = pathToHtmlSafeName;
exports.getHotReplaceTemplate = getHotReplaceTemplate;
exports.wrapDevelopmentCSS = wrapDevelopmentCSS;
function pathToHtmlSafeName(path) {
    return path.replace(/[^a-zA-Z0-9_]/g, '_');
}
function getHotReplaceTemplate(id) {
    // In dev mode, we need to replace the style tag instead of appending it
    // use the path as the expo-css-hmr attribute to find the style tag
    // to replace.
    const attr = JSON.stringify(pathToHtmlSafeName(id));
    return `style.setAttribute('data-expo-css-hmr', ${attr});
  var previousStyle = document.querySelector('[data-expo-css-hmr=${attr}]');
  if (previousStyle) {
    previousStyle.parentNode.replaceChild(style, previousStyle);
  }`;
}
// WARN: The emitted code below is hand-authored as ES5 so it can be embedded
// verbatim into a Metro module factory without going through Babel
function wrapDevelopmentCSS(props) {
    // Ensure we had HMR support to the CSS module in development.
    // Why?
    // -----
    // • Metro recompiles *every* direct dependency of the file you edit. When you
    //   change a component that imports a CSS-module, Metro re-emits the JS stub
    //   that represents that `*.module.css` file, marking it "updated".
    // • The stub exports a plain object (class-name strings) which React-Refresh
    //   does **not** recognise as a component -> the stub itself cannot be a refresh
    //   boundary.
    // • If an UPDATED, NON-BOUNDARY module bubbles all the way up the dependency
    //   graph without meeting another UPDATED boundary, React-Refresh falls
    //   back to a full reload — wiping React state and breaking fast-refresh.
    // • That is exactly what happened: `modal.module.css` changed, its parent
    //   (ModalStack.web.tsx) *didn't* change, so refresh bailed out.
    //
    // Solution
    // ---------
    // We import the CSS here and immediately call `module.hot.accept()` so the
    // update is consumed at this level. React-Refresh no longer has to walk past
    // the stub, the rest of the graph (including the edited component) hot-swaps
    // normally, and local state is preserved.
    // `JSON.stringify` produces a valid JS string literal: it escapes embedded
    // quotes, backslashes, control characters, and Unicode line separators. It
    // also closes the `${`-interpolation footgun that template literals carry
    // when the CSS body contains a literal `${`.
    const cssLiteral = JSON.stringify(props.src);
    const injectClientStyle = `var head = document.head || document.getElementsByTagName('head')[0];
var style = document.createElement('style');
${getHotReplaceTemplate(props.filename)}
style.setAttribute('data-expo-loader', 'css');
if (!style.parentNode) head.appendChild(style);
var css = ${cssLiteral};
if (style.styleSheet){
  style.styleSheet.cssText = css;
} else {
  style.appendChild(document.createTextNode(css));
}`;
    // When bundling React Server Components, add an iife which will broadcast the client JS script to the root client bundle.
    // This will ensure the global CSS is available in the browser in development.
    if (props.reactServer) {
        const injectStyle = `(function(){${injectClientStyle}})();`;
        return `(function () {
if (typeof __expo_rsc_inject_module === 'function') {
  __expo_rsc_inject_module({
    id: ${JSON.stringify(props.filename)},
    code: ${JSON.stringify(injectStyle)},
  });
} else {
  throw new Error('RSC SSR CSS injection function is not found (__expo_rsc_inject_module)');
}
})();`;
    }
    return `(function () {
if (typeof window === 'undefined') {
  return;
}
${injectClientStyle}

if (module.hot) module.hot.accept();
})();`;
}
//# sourceMappingURL=css.js.map