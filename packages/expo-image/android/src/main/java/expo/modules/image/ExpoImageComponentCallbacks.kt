package expo.modules.image

import android.content.ComponentCallbacks2
import android.content.res.Configuration
import expo.modules.image.blurhash.BlurhashDecoder

/**
 * Clears the Blurhash cache when the memory is low,
 * and releases the bitmaps of loaded images when the app's UI is hidden.
 */
object ExpoImageComponentCallbacks : ComponentCallbacks2 {
  override fun onConfigurationChanged(newConfig: Configuration) = Unit

  override fun onLowMemory() {
    BlurhashDecoder.clearCache()
  }

  override fun onTrimMemory(level: Int) {
    if (level == ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL) {
      onLowMemory()
    }
    if (level >= ComponentCallbacks2.TRIM_MEMORY_UI_HIDDEN) {
      ExpoImageViewWrapper.releaseBitmapsWhileHidden(level)
    }
  }
}
