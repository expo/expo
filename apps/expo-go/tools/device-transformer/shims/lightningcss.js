'use strict';
function unsupported(name) {
  return function () {
    throw new Error('lightningcss.' + name + ' is not available in the Hermes runtime (native addon)');
  };
}
module.exports = {
  transform: unsupported('transform'),
  bundle: unsupported('bundle'),
  browserslistToTargets: unsupported('browserslistToTargets'),
  composeVisitors: unsupported('composeVisitors'),
};
