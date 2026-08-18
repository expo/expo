export default jest.fn(() => ({
  bundleLoadedFromServer: true,
  fullBundleUrl:
    'http://localhost:19000?platform=android&modulesOnly=true&runModule=false&runtimeBytecodeVersion=null',
  url: 'http://localhost:19000/',
}));
