package expo.modules.core.interfaces;

import android.app.Activity;

import expo.modules.kotlin.providers.AppCompatActivityProvider;

/**
 * @deprecated When using `expo-modules-core` use {@link AppCompatActivityProvider}
 */
public interface ActivityProvider {
  /**
   * @deprecated Use {@link AppCompatActivityProvider#getAppCompatActivity()}
   */
  Activity getCurrentActivity();
}
