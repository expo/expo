import { transformSync } from '@babel/core';

export function toCommonJS(filename: string, code: string) {
  const result = transformSync(code, {
    filename,
    babelrc: false,
    plugins: [
      [
        require('@babel/plugin-transform-modules-commonjs'),
        {
          // NOTE(@kitten): We used to use sucrase to transform, which is why
          // we're doing this CJS-to-ESM transform in the first place. Our
          // previous transformation isn't 100% compatible with the standard
          // Node ESM loading. In Babel, this is the "node" flag (although
          // node behaviour is explicitly different from this). This skips
          // the `__esModule -> default` wrapper
          importInterop: 'node',
          loose: true,
        },
      ],
    ],
  });
  return result?.code ?? code;
}
