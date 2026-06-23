// Shared SWC type-stripping transform for the node-targeted Jest presets

/** @type {import('jest').Config['transform']} */
module.exports = {
  '^.+\\.[jt]sx?$': [
    require.resolve('@swc/jest'),
    {
      jsc: {
        parser: { syntax: 'typescript', tsx: true, dynamicImport: true },
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
  ],
};
