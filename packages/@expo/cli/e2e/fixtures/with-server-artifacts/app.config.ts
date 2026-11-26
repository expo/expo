export default {
  name: 'Server artifacts',
  slug: 'server-artifacts',
  web: { output: 'server', bundler: 'metro' },
  experiments: {
    noxcturnalTransformWorker: true,
    reactServerComponentRoutes: process.env.TEST_RSC === '1',
    reactServerFunctions: process.env.TEST_RSC === '1',
  },
  plugins: [['expo-router', { root: process.env.TEST_RSC === '1' ? './rsc' : './app' }]],
};
