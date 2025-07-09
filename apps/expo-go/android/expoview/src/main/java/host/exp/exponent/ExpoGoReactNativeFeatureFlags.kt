// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent

import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlagsDefaults

internal object ExpoGoReactNativeFeatureFlags {
  fun setup() {
    ReactNativeFeatureFlags.override(
      object : ReactNativeNewArchitectureFeatureFlagsDefaults(newArchitectureEnabled = true) {
        override fun useFabricInterop(): Boolean = true

        override fun fuseboxEnabledRelease(): Boolean =
          true
      }
    )
  }
}
