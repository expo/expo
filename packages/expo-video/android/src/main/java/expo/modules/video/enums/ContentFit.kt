package expo.modules.video.enums

import androidx.media3.ui.AspectRatioFrameLayout
import expo.modules.kotlin.types.Enumerable

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
enum class ContentFit(val value: String) : Enumerable {
  CONTAIN("contain"),
  FILL("fill"),
  COVER("cover");

  fun toResizeMode(): Int {
    return when (this) {
      CONTAIN -> AspectRatioFrameLayout.RESIZE_MODE_FIT
      FILL -> AspectRatioFrameLayout.RESIZE_MODE_FILL
      COVER -> AspectRatioFrameLayout.RESIZE_MODE_ZOOM
    }
  }
}
