"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertSvgModule = convertSvgModule;
exports.matchSvgModule = matchSvgModule;
exports.transformSvg = transformSvg;
function _metroTransformWorker() {
  const data = _interopRequireDefault(require("metro-transform-worker"));
  _metroTransformWorker = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

async function convertSvgModule(projectRoot, src, options) {
  const {
    resolveConfig,
    transform
  } = require('@svgr/core');
  const isNotNative = !options.platform || options.platform === 'web';
  const defaultSVGRConfig = {
    native: !isNotNative,
    plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
    svgoConfig: {
      // TODO: Maybe there's a better config for web?
      plugins: [{
        name: 'preset-default',
        params: {
          overrides: {
            inlineStyles: {
              onlyMatchedOnce: false
            },
            removeViewBox: false,
            removeUnknownsAndDefaults: false,
            convertColors: false
          }
        }
      }]
    }
  };
  const svgUserConfig = await resolveConfig(projectRoot);
  const svgrConfig = svgUserConfig ? {
    ...defaultSVGRConfig,
    ...svgUserConfig
  } : defaultSVGRConfig;
  return await transform(src,
  // @ts-expect-error
  svgrConfig);
}
async function transformSvg(config, projectRoot, filename, data, options) {
  return _metroTransformWorker().default.transform(config, projectRoot, filename, Buffer.from(await convertSvgModule(projectRoot, data.toString(), options)), options);
}
function matchSvgModule(filePath) {
  return !!/\.module(\.(native|ios|android|web))?\.svg$/.test(filePath);
}
//# sourceMappingURL=svg-modules.js.map