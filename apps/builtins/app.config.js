const path = require('node:path');
/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  jsEngine: "hermes",
  newArchEnabled: true,
  experiments: {
    reactCanary: false,
    reactCompiler: false,
  },
};
