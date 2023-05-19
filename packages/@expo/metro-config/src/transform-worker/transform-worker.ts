/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import worker, {
  JsTransformerConfig,
  JsTransformOptions,
  TransformResponse,
} from 'metro-transform-worker';

import { matchCssModule } from './css-modules';
import { nativeCssTransform } from './nativeCssTransform';
import { webCssTransform } from './webCssTransform';

export type ExpoJsTransformerConfig = {
  externallyManagedCss?: Record<string, string>;
  cssInterop?: boolean;
};

export async function transform(
  config: JsTransformerConfig & ExpoJsTransformerConfig,
  projectRoot: string,
  filename: string,
  data: Buffer,
  options: JsTransformOptions
): Promise<TransformResponse> {
  const isCss = options.type !== 'asset' && /\.(s?css|sass)$/.test(filename);
  // If the file is not CSS, then use the default behavior.
  if (!isCss) {
    return worker.transform(config, projectRoot, filename, data, options);
  }

  if (config.externallyManagedCss?.[filename]) {
    return worker.transform(
      config,
      projectRoot,
      filename,
      Buffer.from(`module.exports = require("${config.externallyManagedCss?.[filename]}")`),
      options
    );
  }

  // If the platform is not web, then return an empty module.
  if (options.platform !== 'web') {
    const code = matchCssModule(filename) ? 'module.exports={};' : '';
    return worker.transform(
      config,
      projectRoot,
      filename,
      // TODO: Native CSS Modules
      Buffer.from(code),
      options
    );
  }

  // While this is called webCss
  if (!config.cssInterop) {
    return webCssTransform(config, projectRoot, filename, data, options);
  }

  if (options.platform === 'web') {
    return webCssTransform(config, projectRoot, filename, data, options);
  } else {
    return nativeCssTransform(config, projectRoot, filename, data, options);
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
  ...worker,
  transform,
};
