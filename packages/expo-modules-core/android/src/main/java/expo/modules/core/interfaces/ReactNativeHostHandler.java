package expo.modules.core.interfaces;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;

import androidx.annotation.Nullable;

public interface ReactNativeHostHandler {
  /**
   * Given chance for modules to customize {@link ReactInstanceManager}
   *
   * @param useDeveloperSupport true if {@link ReactNativeHost} enabled developer support
   * @return instance of {@link ReactInstanceManager}, or null if not to override
   */
  @Nullable
  default ReactInstanceManager createReactInstanceManager(boolean useDeveloperSupport) {
    return null;
  }

  /**
   * Given chance for modules to override react bundle file.
   * e.g. for expo-updates
   *
   * @param useDeveloperSupport true if {@link ReactNativeHost} enabled developer support
   * @return custom path to bundle file, or null if not to override
   */
  @Nullable
  default String getJSBundleFile(boolean useDeveloperSupport) {
    return null;
  }

  /**
   * Given chance for modules to override react bundle asset name.
   * e.g. for expo-updates
   *
   * @param useDeveloperSupport true if {@link ReactNativeHost} enabled developer support
   * @return custom bundle asset name, or null if not to override
   */
  @Nullable
  default String getBundleAssetName(boolean useDeveloperSupport) {
    return null;
  }

  //region event listeners

  /**
   * Given chance for JSI modules to register, e.g. for react-native-reanimated
   *
   * @param useDeveloperSupport true if {@link ReactNativeHost} enabled developer support
   */
  default void onRegisterJSIModules(
    ReactApplicationContext reactApplicationContext,
    JavaScriptContextHolder jsContext,
    boolean useDeveloperSupport
  ) {
  }

  /**
   * Callback before {@link ReactInstanceManager} creation
   */
  default void onWillCreateReactInstanceManager(boolean useDeveloperSupport) {}

  /**
   * Callback after {@link ReactInstanceManager} creation
   */
  default void onDidCreateReactInstanceManager(ReactInstanceManager reactInstanceManager, boolean useDeveloperSupport) {}

  //endregion
}
