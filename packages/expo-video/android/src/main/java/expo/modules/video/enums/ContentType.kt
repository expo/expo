package expo.modules.video.enums

import androidx.media3.common.MimeTypes
import expo.modules.kotlin.types.Enumerable

enum class ContentType(val value: String) : Enumerable {
  AUTO("auto"),
  PROGRESSIVE("progressive"),
  HLS("hls"),
  DASH("dash"),
  SMOOTH_STREAMING("smoothStreaming");

  fun toMimeTypeString(): String? {
    return when (this) {
      AUTO -> null
      PROGRESSIVE -> null
      HLS -> MimeTypes.APPLICATION_M3U8
      DASH -> MimeTypes.APPLICATION_MPD
      SMOOTH_STREAMING -> MimeTypes.APPLICATION_SS
    }
  }
}
