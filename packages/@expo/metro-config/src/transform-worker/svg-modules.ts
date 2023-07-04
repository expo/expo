/**
 * Copyright 2023-present 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import worker, {
  JsTransformerConfig,
  JsTransformOptions,
  TransformResponse,
} from 'metro-transform-worker';

export async function convertSvgModule(
  projectRoot: string,
  src: string,
  options: Pick<JsTransformOptions, 'platform'>
): Promise<string> {
  const { resolveConfig, transform } = require('@svgr/core') as typeof import('@svgr/core');
  const isNotNative = !options.platform || options.platform === 'web';

  const defaultSVGRConfig = {
    native: !isNotNative,
    plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
    svgoConfig: {
      // TODO: Maybe there's a better config for web?
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              inlineStyles: {
                onlyMatchedOnce: false,
              },
              removeViewBox: false,
              removeUnknownsAndDefaults: false,
              convertColors: false,
            },
          },
        },
      ],
    },
  };

  const svgUserConfig = await resolveConfig(projectRoot);
  const svgrConfig = svgUserConfig ? { ...defaultSVGRConfig, ...svgUserConfig } : defaultSVGRConfig;

  return await transform(
    src,
    // @ts-expect-error
    svgrConfig
  );
}

export async function transformSvg(
  config: JsTransformerConfig,
  projectRoot: string,
  filename: string,
  data: Buffer,
  options: JsTransformOptions
): Promise<TransformResponse> {
  return worker.transform(
    config,
    projectRoot,
    filename,
    Buffer.from(await convertSvgModule(projectRoot, data.toString(), options)),
    options
  );
}

export function matchSvgModule(filePath: string): boolean {
  return !!/\.module(\.(native|ios|android|web))?\.svg$/.test(filePath);
}
