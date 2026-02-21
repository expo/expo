import { transformSync } from '@babel/core';

export function toCommonJS(filename: string, code: string) {
  const result = transformSync(code, {
    filename,
    babelrc: false,
    plugins: [
      [
        require('@babel/plugin-transform-modules-commonjs'),
        {
          importInterop: 'node',
          loose: true,
        },
      ],
    ],
  });
  return result?.code ?? code;
}
