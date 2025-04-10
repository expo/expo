package expo.modules.video

import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.os.Build
import expo.modules.video.records.VideoThumbnailOptions
import kotlin.math.max
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
  requestedTime: Duration,
  options: VideoThumbnailOptions? = null
): VideoThumbnail {
  val sizeLimit = options?.toNativeSizeLimit()

  val bitmap = if (sizeLimit != null) {
    val (maxWidth, maxHeight) = sizeLimit
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      getScaledFrameAtTime(
        requestedTime.inWholeMicroseconds,
        MediaMetadataRetriever.OPTION_CLOSEST,
        maxWidth,
        maxHeight
      )
    } else {
      getFrameAtTime(requestedTime.inWholeMicroseconds, MediaMetadataRetriever.OPTION_CLOSEST)
        ?.constrainToDimensions(maxWidth, maxHeight)
    }
  } else {
    getFrameAtTime(requestedTime.inWholeMicroseconds, MediaMetadataRetriever.OPTION_CLOSEST)
  } ?: throw IllegalStateException("Failed to generate thumbnail")

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

private fun Bitmap.constrainToDimensions(maxWidth: Int, maxHeight: Int): Bitmap {
  val width = this.width
  val height = this.height

  val ratio = max(width / maxWidth.toFloat(), height / maxHeight.toFloat())
  if (ratio <= 1) {
    return this
  }

  val newWidth = (width / ratio).toInt()
  val newHeight = (height / ratio).toInt()

  return Bitmap.createScaledBitmap(this, newWidth, newHeight, true)
}
