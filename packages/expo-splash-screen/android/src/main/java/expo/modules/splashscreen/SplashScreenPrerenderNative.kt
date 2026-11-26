package expo.modules.splashscreen

import com.facebook.react.fabric.FabricUIManager

internal object SplashScreenPrerenderNative {
  init {
    System.loadLibrary("expo-splash-screen")
  }

  /**
   * Any thread but the UI thread. Builds the template (sizes in dp) into a shadow tree and lays it
   * out, measuring text through `fabricUIManager`. Returns a handle for [mount] and [release], or 0.
   */
  @JvmStatic
  external fun prepare(
    fabricUIManager: FabricUIManager,
    surfaceId: Int,
    templateJson: String,
    width: Float,
    height: Float,
    pointScaleFactor: Float,
    rightToLeft: Boolean
  ): Long

  /** UI thread, after the surface has started in `fabricUIManager`. Commits and mounts the prepared tree. */
  @JvmStatic
  external fun mount(handle: Long): Boolean

  @JvmStatic
  external fun release(handle: Long, surfaceId: Int)

  /** UI thread. The props of the app's shadow trees by tag, as JSON, or null. */
  @JvmStatic
  external fun captureProps(fabricUIManager: FabricUIManager): String?
}
