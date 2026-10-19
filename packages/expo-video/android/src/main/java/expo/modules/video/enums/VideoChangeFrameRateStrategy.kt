package expo.modules.video.enums

import androidx.media3.common.C
import androidx.media3.common.util.UnstableApi
import expo.modules.kotlin.types.Enumerable

@UnstableApi
enum class VideoChangeFrameRateStrategy(val value: String) : Enumerable {
  OFF("off"),
  ONLY_IF_SEAMLESS("onlyIfSeamless");

  fun toMedia3Strategy(): Int = when (this) {
    OFF -> C.VIDEO_CHANGE_FRAME_RATE_STRATEGY_OFF
    ONLY_IF_SEAMLESS -> C.VIDEO_CHANGE_FRAME_RATE_STRATEGY_ONLY_IF_SEAMLESS
  }
}
