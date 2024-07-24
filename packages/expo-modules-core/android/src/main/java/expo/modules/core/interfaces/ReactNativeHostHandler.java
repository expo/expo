package expo.modules.core.interfaces;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.devsupport.interfaces.DevSupportManager;

public interface ReactNativeHostHandler {
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
   *
   * NOTE: This callback is not supported on bridgeless mode
   */
  @Nullable
  default Object getDevSupportManagerFactory() { return null; }

  /**
   * Given chance for modules to override the javascript executor factory.
   *
   * NOTE: This callback is not supported on bridgeless mode
   */
  @Nullable
  default JavaScriptExecutorFactory getJavaScriptExecutorFactory() { return null; }

  //region event listeners

  /**
   * Callback before react instance creation
   */
  default void onWillCreateReactInstance(boolean useDeveloperSupport) {}

  /**
   * Callback when the {@link DevSupportManager} is available
   */
  default void onDidCreateDevSupportManager(@NonNull DevSupportManager devSupportManager) {}

  /**
   * Callback after react instance creation
   */
  default void onDidCreateReactInstance(boolean useDeveloperSupport, ReactContext reactContext) {}

  /**
   * Callback when receiving unhandled React Native exceptions
   *
   * NOTE: This callback is only available on bridgeless mode
   */
  default void onReactInstanceException(boolean useDeveloperSupport, @NonNull Exception exception) {}

  //endregion
}
