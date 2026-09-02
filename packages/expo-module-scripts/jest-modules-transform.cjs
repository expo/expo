// NOTE(@kitten): Similar to `./jest-swc-transform.cjs` but for node_modules
const SWC_ESM_TRANSFORM = [
  require.resolve('@swc/jest'),
  {
    jsc: {
      parser: { syntax: 'ecmascript', jsx: true },
      target: 'es2022',
      transform: { react: { runtime: 'automatic' } },
      // Emit configurable/writable CommonJS exports so `jest.spyOn`/reassignment of module
      // members works (SWC's default getter-only exports are not mockable).
      experimental: {
        plugins: [[require.resolve('@swc-contrib/mut-cjs-exports'), {}]],
      },
    },
    module: { type: 'commonjs' },
  },
];

/**
 * Builds a mergeable Jest `transform` map that routes the given node_modules through SWC.
 *
 * @param {string[]} moduleNames Package names or scopes to match. Defaults to `DEFAULT_SWC_MODULES`.
 * @returns {import('jest').Config['transform']}
 */
function createModulesTransform(moduleNames = DEFAULT_SWC_MODULES) {
  const pattern = `/node_modules/(?:${moduleNames.join('|')})/.+\\.[cm]?jsx?$`;
  return { [pattern]: SWC_ESM_TRANSFORM };
}

module.exports = { createModulesTransform };
