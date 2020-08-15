const fm = require('front-matter');

module.exports = function(src) {
  const { body, attributes } = fm(src);

  return (
    `import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export const meta = ${JSON.stringify(attributes)}

export default withDocumentationElements(meta);

` + body
  );
};
