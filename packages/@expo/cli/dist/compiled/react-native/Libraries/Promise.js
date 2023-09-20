'use strict';

var Promise = require('promise/setimmediate/es6-extensions');
require('promise/setimmediate/finally');
if (__DEV__) {
  require('promise/setimmediate/rejection-tracking').enable(require("./promiseRejectionTrackingOptions").default);
}
module.exports = Promise;
//# sourceMappingURL=Promise.js.map