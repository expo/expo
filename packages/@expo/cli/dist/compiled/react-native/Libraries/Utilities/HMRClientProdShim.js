'use strict';

var HMRClientProdShim = {
  setup: function setup() {},
  enable: function enable() {
    console.error('Fast Refresh is disabled in JavaScript bundles built in production mode. ' + 'Did you forget to run Metro?');
  },
  disable: function disable() {},
  registerBundle: function registerBundle() {},
  log: function log() {}
};
module.exports = HMRClientProdShim;