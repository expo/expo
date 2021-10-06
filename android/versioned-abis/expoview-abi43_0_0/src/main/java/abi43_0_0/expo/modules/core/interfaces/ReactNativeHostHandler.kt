package abi43_0_0.expo.modules.core.interfaces

import abi43_0_0.com.facebook.react.ReactInstanceManager
import abi43_0_0.com.facebook.react.bridge.JavaScriptContextHolder
import abi43_0_0.com.facebook.react.bridge.ReactApplicationContext

interface ReactNativeHostHandler {
  /**
   * Given chance for modules to customize {@link ReactInstanceManager}
   *
   * @param useDeveloperSupport true if {@link ReactNativeHost} enabled developer support
   * @return instance of {@link ReactInstanceManager}, or null if not to override
   */
  fun createReactInstanceManager(useDeveloperSupport: Boolean): ReactInstanceManager? {
    return null
  }

  /**
   * Given chance for modules to override react bundle file.
   * e.g. for expo-updates
   *
   * @param useDeveloperSupport true if {@link ReactNativeHost} enabled developer support
   * @return custom path to bundle file, or null if not to override
   */
  fun getJSBundleFile(useDeveloperSupport: Boolean): String? {
    return null
  }

  /**
   * Given chance for modules to override react bundle asset name.
   * e.g. for expo-updates
   *
   * @param useDeveloperSupport true if {@link ReactNativeHost} enabled developer support
   * @return custom bundle asset name, or null if not to override
   */
  fun getBundleAssetName(useDeveloperSupport: Boolean): String? {
    return null
  }

  /**
   * Given chance for JSI modules to register, e.g. for react-native-reanimated
   *
   * @param useDeveloperSupport true if {@link ReactNativeHost} enabled developer support
   */
  fun onRegisterJSIModules(
    reactApplicationContext: ReactApplicationContext,
    jsContext: JavaScriptContextHolder,
    useDeveloperSupport: Boolean
  ) {
  }
}
