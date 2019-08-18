const packageConfig = require('../../.eslintrc.js');

module.exports = function getBaseConfig() {
  return {
    settings: {
      react: packageConfig.settings.react,
    },
  };
};
