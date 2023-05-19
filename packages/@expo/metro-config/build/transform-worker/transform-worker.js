"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transform = transform;
function _metroTransformWorker() {
  const data = _interopRequireDefault(require("metro-transform-worker"));
  _metroTransformWorker = function () {
    return data;
  };
  return data;
}
function _cssModules() {
  const data = require("./css-modules");
  _cssModules = function () {
    return data;
  };
  return data;
}
function _nativeCssTransform() {
  const data = require("./nativeCssTransform");
  _nativeCssTransform = function () {
    return data;
  };
  return data;
}
function _webCssTransform() {
  const data = require("./webCssTransform");
  _webCssTransform = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

async function transform(config, projectRoot, filename, data, options) {
  var _config$externallyMan;
  const isCss = options.type !== 'asset' && /\.(s?css|sass)$/.test(filename);
  // If the file is not CSS, then use the default behavior.
  if (!isCss) {
    return _metroTransformWorker().default.transform(config, projectRoot, filename, data, options);
  }
  if ((_config$externallyMan = config.externallyManagedCss) !== null && _config$externallyMan !== void 0 && _config$externallyMan[filename]) {
    var _config$externallyMan2;
    return _metroTransformWorker().default.transform(config, projectRoot, filename, Buffer.from(`module.exports = require("${(_config$externallyMan2 = config.externallyManagedCss) === null || _config$externallyMan2 === void 0 ? void 0 : _config$externallyMan2[filename]}")`), options);
  }

  // If the platform is not web, then return an empty module.
  if (options.platform !== 'web') {
    const code = (0, _cssModules().matchCssModule)(filename) ? 'module.exports={};' : '';
    return _metroTransformWorker().default.transform(config, projectRoot, filename,
    // TODO: Native CSS Modules
    Buffer.from(code), options);
  }

  // While this is called webCss
  if (!config.cssInterop) {
    return (0, _webCssTransform().webCssTransform)(config, projectRoot, filename, data, options);
  }
  if (options.platform === 'web') {
    return (0, _webCssTransform().webCssTransform)(config, projectRoot, filename, data, options);
  } else {
    return (0, _nativeCssTransform().nativeCssTransform)(config, projectRoot, filename, data, options);
  }
}

/**
 * A custom Metro transformer that adds support for processing Expo-specific bundler features.
 * - Global CSS files on web.
 * - CSS Modules on web.
 * - TODO: Tailwind CSS on web.
 */
module.exports = {
  // Use defaults for everything that's not custom.
  ..._metroTransformWorker().default,
  transform
};
//# sourceMappingURL=transform-worker.js.map