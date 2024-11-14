package expo.modules.video

import android.media.MediaMetadataRetriever
import kotlin.math.roundToLong
import kotlin.time.Duration
import kotlin.time.DurationUnit
import kotlin.time.toDuration

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
  requestedTime: Duration
): VideoThumbnail {
  val bitmap = getFrameAtTime(requestedTime.inWholeMicroseconds, MediaMetadataRetriever.OPTION_CLOSEST)
    ?: throw IllegalStateException("Failed to generate thumbnail")
  val actualTime = calculateActualFrameTime(this, requestedTime)
  return VideoThumbnail(bitmap, requestedTime, actualTime)
}

private fun calculateActualFrameTime(mediaMetadataRetriever: MediaMetadataRetriever, time: Duration): Duration {
  // if we can't get the frame rate, we are returning the requested time
  val frameTime = mediaMetadataRetriever.frameTime() ?: return time

  // calculate closest frame index
  val frameIndex = (time.inWholeMicroseconds.toDouble() / frameTime).roundToLong()

  return (frameIndex * frameTime).toDuration(DurationUnit.MICROSECONDS)
}

private fun MediaMetadataRetriever.frameTime(): Double? {
  // frame count is not available on Android SDK < 28
  if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.P) {
    return null
  }

  val duration = this.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toDouble()
    ?: return null
  val frameCount = this.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_FRAME_COUNT)?.toDouble()
    ?: return null

  return (duration * 1000) / frameCount
}
