"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getHotReplaceTemplate = getHotReplaceTemplate;
exports.pathToHtmlSafeName = pathToHtmlSafeName;
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
  const previousStyle = document.querySelector('[data-expo-css-hmr=${attr}]');
  if (previousStyle) {
    previousStyle.parentNode.removeChild(previousStyle);
  }`;
}
function wrapDevelopmentCSS(props) {
  const withBackTicksEscaped = props.src.replace(/`/g, '\\`');
  return `(() => {
  if (typeof document === 'undefined') {
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
//# sourceMappingURL=css.js.map