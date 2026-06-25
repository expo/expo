package expo.modules.kotlin.jni

import com.facebook.soloader.SoLoader

/**
 * Loads the optional `libexpo-modules-worklets.so`.
 */
internal object WorkletsSoLoader {
  /**
   * Whether `libexpo-modules-worklets.so` is present and was loaded successfully.
   * The first access attempts the load.
   */
  val isAvailable: Boolean by lazy {
    runCatching { SoLoader.loadLibrary("expo-modules-worklets") }
      .isSuccess
  }

  /**
   * Triggers the load. Safe to call even when `react-native-worklets` isn't
   * installed - it never throws.
   */
  fun loadIfPresent() {
    isAvailable
  }
}
