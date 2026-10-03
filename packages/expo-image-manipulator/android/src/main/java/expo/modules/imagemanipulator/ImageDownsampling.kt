package expo.modules.imagemanipulator

import android.graphics.Bitmap
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Computes the size that bounds an image of the given dimensions to `maxWidth`/`maxHeight`,
 * preserving the aspect ratio. Returns `null` when the image already fits within the bounds
 * (or no bounds are given), in which case no downscaling is needed.
 */
internal fun boundedSize(width: Int, height: Int, maxWidth: Int?, maxHeight: Int?): Pair<Int, Int>? {
  if (width <= 0 || height <= 0) {
    return null
  }
  var scale = 1.0
  if (maxWidth != null && maxWidth > 0) {
    scale = min(scale, maxWidth.toDouble() / width)
  }
  if (maxHeight != null && maxHeight > 0) {
    scale = min(scale, maxHeight.toDouble() / height)
  }
  if (scale >= 1.0) {
    return null
  }
  return Pair(max(1, (width * scale).roundToInt()), max(1, (height * scale).roundToInt()))
}

/**
 * Downscales an already decoded bitmap to fit within `maxWidth`/`maxHeight`.
 * Returns the bitmap untouched when it already fits within the bounds.
 */
internal fun downscaleIfExceedsBounds(bitmap: Bitmap, maxWidth: Int?, maxHeight: Int?): Bitmap {
  val (width, height) = boundedSize(bitmap.width, bitmap.height, maxWidth, maxHeight) ?: return bitmap
  return Bitmap.createScaledBitmap(bitmap, width, height, true)
}
