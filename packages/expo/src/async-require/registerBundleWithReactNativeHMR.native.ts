export function registerBundleWithReactNativeHMR(requestUrl: string): boolean {
  const reactNativeHMRClient = require('react-native/Libraries/Utilities/HMRClient').default;
  reactNativeHMRClient.registerBundle(requestUrl);
  return true;
}
