import { transformSync } from '@babel/core';

export function toCommonJS(
  filename: string,
  code: string,
  importInterop: 'node' | 'babel' = 'node'
) {
  const result = transformSync(code, {
    filename,
    babelrc: false,
    configFile: false,
    plugins: [
      [
        require('@babel/plugin-transform-modules-commonjs'),
        {
          // Preserve legacy JavaScript imports of the whole CommonJS exports object.
          // TypeScript's stripping fallback opts into Babel's __esModule interop.
          importInterop,
          loose: true,
        },
      ],
    ],
  });
  return result?.code ?? code;
}
