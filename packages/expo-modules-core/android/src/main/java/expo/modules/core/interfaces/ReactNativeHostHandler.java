package expo.modules.core.interfaces;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.JavaScriptExecutorFactory;

import androidx.annotation.Nullable;

public interface ReactNativeHostHandler {
  /**
   * Given chance for modules to customize {@link ReactInstanceManager}
   *
   * @param useDeveloperSupport true if {@link com.facebook.react.ReactNativeHost} enabled developer support
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
   * @param useDeveloperSupport true if {@link com.facebook.react.ReactNativeHost} enabled developer support
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
   * @param useDeveloperSupport true if {@link com.facebook.react.ReactNativeHost} enabled developer support
   * @return custom bundle asset name, or null if not to override
   */
  @Nullable
  default String getBundleAssetName(boolean useDeveloperSupport) {
    return null;
  }

  /**
   * Give modules a chance to override the value for useDeveloperSupport,
   * e.g. for expo-dev-launcher
   *
   * @return value for useDeveloperSupport, or null if not to override
   */
  @Nullable
  default Boolean getUseDeveloperSupport() {
    return null;
  }

  /**
   * Given chance for modules to override react dev support manager factory.
   * e.g. for expo-dev-client
   *
   * Note: we can't specify the type here, because the `DevSupportManagerFactory`
   * doesn't exist in the React Native 0.66 or below.
   *
   * @return custom DevSupportManagerFactory, or null if not to override
   */
  @Nullable
  default Object getDevSupportManagerFactory() { return null; }

  /**
   * Given chance for modules to override the javascript executor factory.
   */
  @Nullable
  default JavaScriptExecutorFactory getJavaScriptExecutorFactory() { return null; }

  //region event listeners

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
