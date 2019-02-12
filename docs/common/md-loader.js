const fm = require('front-matter');

module.exports = async function(src) {
  const callback = this.async();
  const { body, attributes } = fm(src);

  const code = `export const meta = ${JSON.stringify(attributes)}

${body}`;

  return callback(null, code);
};
