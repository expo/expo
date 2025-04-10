package expo.modules.rncompatibility

import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags

/**
 * A compatibility helper of
 * `com.facebook.react.config.ReactFeatureFlags` and
 * `com.facebook.react.internal.featureflags.ReactNativeFeatureFlags`
 */
object ReactNativeFeatureFlags {
  val enableBridgelessArchitecture = ReactNativeFeatureFlags.enableBridgelessArchitecture()
}
