const defaultTransformerPath = require('expo/metro-config').unstable_transformerPath;
const defaultTransform = require(defaultTransformerPath).transform;

function transform(config, projectRoot, filename, data, options, ...rest) {
  let newData = data;
  if (filename.endsWith('.css')) {
    // We need to rewrite :host to :root as the DOM component
    // on iOS and Android does not render in shadow DOM.
    const originalCss = newData.toString('utf8');
    const newCss = originalCss.replace(/^:host/gm, ':root');
    newData = Buffer.from(newCss, 'utf8');
  }
  return defaultTransform(config, projectRoot, filename, newData, options, ...rest);
}

module.exports = {
  transform,
};
