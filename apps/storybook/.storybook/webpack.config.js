const path = require('path');
const webpackConfig = require('./webpack.config.expo');
const merge = require('webpack-merge');

module.exports = function({ mode, config }, argv) {
  const props =
    mode.toLowerCase() === 'production'
      ? { production: true, development: false }
      : { production: false, development: true };
  const expoConfig = webpackConfig({ ...props, projectRoot: path.resolve(__dirname, '../') }, argv);
  return merge(expoConfig, config);
};
