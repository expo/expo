import { transformSync } from '@babel/core';

export function toCommonJS(filename: string, code: string) {
  const result = transformSync(code, {
    filename,
    babelrc: false,
    configFile: false,
    plugins: [
      [
        require('@babel/plugin-transform-modules-commonjs'),
        {
          // NOTE(@gustavohariel): We must keep Babel's default `__esModule` interop here, so that
          // a default import of a transpiled module resolves to its `exports.default` rather than
          // to the module namespace object. Every compiled Expo config plugin has that shape, and
          // Node's `require(esm)` namespace carries `__esModule` too. This matches what
          // TypeScript's `transpileModule` emits on the other code path in `evalModule`, so both
          // transforms agree on what a default import means.
          importInterop: 'babel',
          loose: true,
        },
      ],
    ],
  });
  return result?.code ?? code;
}
