import { NativeModules } from "react-native";
export function shouldFallbackToLegacyNativeModule() {
  var _NativeModules$Native;
  const expoConstants = (_NativeModules$Native = NativeModules["NativeUnimoduleProxy"]) === null || _NativeModules$Native === void 0 || (_NativeModules$Native = _NativeModules$Native.modulesConstants) === null || _NativeModules$Native === void 0 ? void 0 : _NativeModules$Native.ExponentConstants;
  if (expoConstants) {
    /**
     * In SDK <= 39, appOwnership is defined in managed apps but executionEnvironment is not.
     * In bare React Native apps using expo-constants, appOwnership is never defined, so
     * isLegacySdkVersion will be false in that context.
     */
    const isLegacySdkVersion = expoConstants.appOwnership && !expoConstants.executionEnvironment;

    /**
     * Expo managed apps don't include the @react-native-async-storage/async-storage
     * native modules yet, but the API interface is the same, so we can use the version
     * exported from React Native still.
     *
     * If in future releases (eg: @react-native-async-storage/async-storage >= 2.0.0) this
     * will likely not be valid anymore, and the package will need to be included in the Expo SDK
     * to continue to work.
     */
    if (isLegacySdkVersion || ["storeClient", "standalone"].includes(expoConstants.executionEnvironment)) {
      return true;
    }
  }
  return false;
}
//# sourceMappingURL=shouldFallbackToLegacyNativeModule.js.map