const { foo } = require('./export-json_app.config');

module.exports = function ({ config }) {
  config.foo = foo;
  return config;
};
