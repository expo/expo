const fm = require('front-matter');
const path = require('path');

module.exports = async function(src) {
  const callback = this.async();
  const { body, attributes } = fm(src);

  wde = path.resolve('components/page-higher-order/withDocumentationElements');

  this.addDependency(wde);

  const code =
    `import withDocumentationElements from '${wde}';

export const meta = ${JSON.stringify(attributes)}

export default withDocumentationElements(meta);

` + body;

  return callback(null, code);
};
