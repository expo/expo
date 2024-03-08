"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeBackticksAndOctals = exports.wrapDevelopmentCSS = exports.getHotReplaceTemplate = exports.pathToHtmlSafeName = void 0;
function pathToHtmlSafeName(path) {
    return path.replace(/[^a-zA-Z0-9_]/g, '_');
}
exports.pathToHtmlSafeName = pathToHtmlSafeName;
function getHotReplaceTemplate(id) {
    // In dev mode, we need to replace the style tag instead of appending it
    // use the path as the expo-css-hmr attribute to find the style tag
    // to replace.
    const attr = JSON.stringify(pathToHtmlSafeName(id));
    return `style.setAttribute('data-expo-css-hmr', ${attr});
  const previousStyle = document.querySelector('[data-expo-css-hmr=${attr}]');
  if (previousStyle) {
    previousStyle.parentNode.removeChild(previousStyle);
  }`;
}
exports.getHotReplaceTemplate = getHotReplaceTemplate;
function wrapDevelopmentCSS(props) {
    const withBackTicksEscaped = escapeBackticksAndOctals(props.src);
    return `(() => {
  if (typeof window === 'undefined') {
    return
  }
  const head = document.head || document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  ${getHotReplaceTemplate(props.filename)}
  style.setAttribute('data-expo-loader', 'css');
  head.appendChild(style);
  const css = \`${withBackTicksEscaped}\`;
  if (style.styleSheet){
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
})();`;
}
exports.wrapDevelopmentCSS = wrapDevelopmentCSS;
function escapeBackticksAndOctals(str) {
    if (typeof str !== 'string') {
        return '';
    }
    return str
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/[\0-\7]/g, (match) => `\\0${match.charCodeAt(0).toString(8)}`);
}
exports.escapeBackticksAndOctals = escapeBackticksAndOctals;
//# sourceMappingURL=css.js.map