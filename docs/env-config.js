// this file exports a bunch of replacements
// that are made across the source-code

module.exports = {
  'process.env.NODE_ENV': process.env.NODE_ENV,
  'process.env.LATEST_VERSION': 'v' + require('./package').version,
  ASSETS_URL: '/static',
};
