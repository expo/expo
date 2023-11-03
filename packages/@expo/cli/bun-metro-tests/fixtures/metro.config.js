// Remove the prelude from the bundle
const banner = ``;
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const config = getDefaultConfig(path.join(__dirname, 'one'));

module.exports = {
  ...config,
  serializer: {
    ...config.serializer,
    getModulesRunBeforeMainModule: () => {
      return [];
    },
    getPolyfills: () => [],
  },
};
// config.transformer.workerPath = require.resolve('metro/src/DeltaBundler/Worker');
// /** @type {import('expo/metro-config').MetroConfig} */
// module.exports = {
//   transformer: {
//     workerPath: require.resolve('metro/src/DeltaBundler/Worker'),
//   },
//   serializer: {
//     getRunModuleStatement: (moduleId) => `require(${JSON.stringify(moduleId)})`,
//     getModulesRunBeforeMainModule: () => {
//       return [];
//     },
//     getPolyfills: () => [],
//     // customSerializer: (entryPoint, preModules, graph, options) => {
//     //   const baseJSBundle = require('metro/src/DeltaBundler/Serializers/baseJSBundle');
//     //   const bundleToString = require('metro/src/lib/bundleToString');
//     //   const prelude = preModules.find((module) => module.path === '__prelude__');
//     //   console.log('prelude');
//     //   if (prelude) {
//     //     prelude.output[0].data.code = banner;
//     //   }
//     //   return bundleToString(baseJSBundle(entryPoint, preModules, graph, options)).code;
//     // },
//   },
// };
