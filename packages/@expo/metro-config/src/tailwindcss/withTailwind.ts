import type { ConfigT } from 'metro-config';
import path from 'path';
import { build as twBuild } from 'tailwindcss/lib/cli/build';

import type { ExpoJsTransformerConfig } from '../transform-worker/transform-worker';

type TailwindConfigT = ConfigT & { transformer: ExpoJsTransformerConfig };

export function withTailwind(
  config: TailwindConfigT,
  cssPathname = './global.css',
  {
    input = path.relative(process.cwd(), cssPathname),
    output = path.resolve(process.cwd(), 'node_modules/.cache/expo/', cssPathname),
  } = {}
): TailwindConfigT {
  const getTransformOptions = async (entryPoints: any, options: any, getDependenciesOf: any) => {
    process.stdout.clearLine(0);

    await twBuild({
      '--input': input,
      '--output': output,
      '--watch': options.dev ? 'always' : false,
      '--poll': true,
    });

    return config.transformer?.getTransformOptions?.(entryPoints, options, getDependenciesOf);
  };

  return {
    ...config,
    resolver: {
      ...config.resolver,
      sourceExts: Array.from(new Set([...config.resolver.sourceExts, path.extname(cssPathname)])),
    },
    transformerPath: require.resolve('@expo/metro-config/transformer'),
    transformer: {
      ...config.transformer,
      getTransformOptions,
      cssInterop: true,
      externallyManagedCss: {
        ...config.transformer.externallyManagedCss,
        [input]: output,
      },
    },
  };
}
