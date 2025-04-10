"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathToHtmlSafeName = pathToHtmlSafeName;
exports.getHotReplaceTemplate = getHotReplaceTemplate;
exports.wrapDevelopmentCSS = wrapDevelopmentCSS;
exports.escapeBackticksAndOctals = escapeBackticksAndOctals;
function pathToHtmlSafeName(path) {
    return path.replace(/[^a-zA-Z0-9_]/g, '_');
}
function getHotReplaceTemplate(id) {
    // In dev mode, we need to replace the style tag instead of appending it
    // use the path as the expo-css-hmr attribute to find the style tag
    // to replace.
    const attr = JSON.stringify(pathToHtmlSafeName(id));
    return `style.setAttribute('data-expo-css-hmr', ${attr});
  const previousStyle = document.querySelector('[data-expo-css-hmr=${attr}]');
  if (previousStyle) {
    previousStyle.parentNode.replaceChild(style, previousStyle);
  }`;
}
function wrapDevelopmentCSS(props) {
    const withBackTicksEscaped = escapeBackticksAndOctals(props.src);
    const injectClientStyle = `const head = document.head || document.getElementsByTagName('head')[0];
const style = document.createElement('style');
${getHotReplaceTemplate(props.filename)}
style.setAttribute('data-expo-loader', 'css');
if (!style.parentNode) head.appendChild(style);
const css = \`${withBackTicksEscaped}\`;
if (style.styleSheet){
  style.styleSheet.cssText = css;
} else {
  style.appendChild(document.createTextNode(css));
}`;
    // When bundling React Server Components, add an iife which will broadcast the client JS script to the root client bundle.
    // This will ensure the global CSS is available in the browser in development.
    if (props.reactServer) {
        const injectStyle = `(()=>{${injectClientStyle}})();`;
        return `(() => {
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
    const injectStyle = `(() => {
if (typeof window === 'undefined') {
  return
}
${injectClientStyle}
})();`;
    return injectStyle;
}
function escapeBackticksAndOctals(str) {
    if (typeof str !== 'string') {
        return '';
    }
    return str
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/[\x00-\x07]/g, (match) => `\\0${match.charCodeAt(0).toString(8)}`);
}
//# sourceMappingURL=css.js.map