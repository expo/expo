package expo.modules.splashscreen

import com.facebook.react.fabric.FabricUIManager

internal object SplashScreenPrerenderNative {
  init {
    System.loadLibrary("expo-splash-screen")
  }

  /** Builds the template into the surface's shadow tree and commits it. Returns the node count, or -1. */
  @JvmStatic
  external fun commit(fabricUIManager: FabricUIManager, surfaceId: Int, templateJson: String): Int
}
