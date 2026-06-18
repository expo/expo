/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$',
  transform: {
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
  },
  watchPlugins: [
    require.resolve('jest-watch-typeahead/filename'),
    require.resolve('jest-watch-typeahead/testname'),
  ],
  // See: https://jestjs.io/docs/configuration#prettierpath-string
  prettierPath: require.resolve('jest-snapshot-prettier'),
};
