/** @type {import('expo/metro-config').MetroConfig} */
const config = {};
const path = require('path');

const root = path.join(__dirname, '../..');

config.watchFolders = [__dirname, ...['packages', 'node_modules'].map((v) => path.join(root, v))];

const banner = `var process=this.process||{},__METRO_GLOBAL_PREFIX__='';`;

const baseJSBundle = require('metro/src/DeltaBundler/Serializers/baseJSBundle');
const bundleToString = require('metro/src/lib/bundleToString');

config.serializer = {
  customSerializer: (entryPoint, preModules, graph, options) => {
    const prelude = preModules.find((module) => module.path === '__prelude__');
    if (prelude) {
      prelude.output[0].data.code = banner;
    }
    return bundleToString(baseJSBundle(entryPoint, preModules, graph, options)).code;
  },
};

module.exports = config;
