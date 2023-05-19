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

import { nativeCssTransform } from './nativeCssTransform';
import { webCssTransform } from './webCssTransform';

export async function transform(
  config: JsTransformerConfig,
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
