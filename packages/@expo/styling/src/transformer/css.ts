export function pathToHtmlSafeName(path: string) {
  return path.replace(/[^a-zA-Z0-9_]/g, "_");
}

export function getHotReplaceTemplate(id: string) {
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

export function wrapDevelopmentCSS(props: { src: string; filename: string }) {
  const withBackTicksEscaped = escapeBackticksAndOctals(props.src);
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

export function escapeBackticksAndOctals(str: string) {
  if (typeof str !== "string") {
    return "";
  }

  return str
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/[\0-\7]/g, (match) => `\\0${match.charCodeAt(0).toString(8)}`);
}
