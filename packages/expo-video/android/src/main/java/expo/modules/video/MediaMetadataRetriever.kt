package expo.modules.video

import android.media.MediaMetadataRetriever
import kotlin.time.Duration

suspend fun <T> MediaMetadataRetriever.safeUse(block: suspend MediaMetadataRetriever.() -> T): T {
  try {
    return block()
  } finally {
    try {
      this.close()
    } finally {
      // ignore
    }
  }
}

fun MediaMetadataRetriever.generateThumbnailAtTime(
  time: Duration
): VideoThumbnail {
  val bitmap = getFrameAtTime(time.inWholeMicroseconds)
    ?: throw IllegalStateException("Failed to generate thumbnail")
  return VideoThumbnail(bitmap, time)
}
