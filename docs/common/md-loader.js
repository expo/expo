const fm = require('front-matter');

module.exports = async function(src) {
  const callback = this.async();
  const { body, attributes } = fm(src);

  const code =
    `import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export const meta = ${JSON.stringify(attributes)}

export default withDocumentationElements(meta);

` + body;

  return callback(null, code);
};
