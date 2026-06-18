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
      },
      module: { type: 'commonjs', lazy: true },
    },
  ],
};
