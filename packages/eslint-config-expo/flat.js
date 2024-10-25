module.exports = [
  require('./flat/base'),
  require('./flat/globals-cjs'),
  require('./flat/globals-jest'),
  ...require('./flat/globals-runtime'),
  require('./flat/globals-jest'),
  require('./flat/plugin-expo'),
  require('./flat/plugin-react'),
  require('./flat/plugin-typescript'),
];
