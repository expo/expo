package expo.modules.image

import android.content.res.Resources
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.RectF
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.PictureDrawable
import com.bumptech.glide.request.FutureTarget
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runInterruptible

/**
 * Converts blocking [java.util.concurrent.Future] result into non-blocking suspend function.
 */
internal suspend fun <T> FutureTarget<T>.awaitGet(): T = runInterruptible(Dispatchers.IO) { get() }

/**
 * Converts [Drawable] to [BitmapDrawable]
 * Supported drawable types: [PictureDrawable], [BitmapDrawable]
 * @param appResources Android application's resources
 * @throws IllegalArgumentException when conversion of given [Drawable] is not supported
 */
internal fun Drawable.toBitmapDrawable(appResources: Resources): BitmapDrawable =
  when (this) {
    is BitmapDrawable -> this
    is PictureDrawable -> {
      val bitmap = Bitmap.createBitmap(intrinsicWidth, intrinsicHeight, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bitmap)
      canvas.drawPicture(picture)
      BitmapDrawable(appResources, bitmap)
    }
    else -> throw IllegalArgumentException("Drawable must be either BitmapDrawable or PictureDrawable")
  }

fun calcXTranslation(
  value: Float,
  imageRect: RectF,
  viewRect: RectF,
  isPercentage: Boolean = false,
  isReverse: Boolean = false
): Float = calcTranslation(value, imageRect.width(), viewRect.width(), isPercentage, isReverse)

fun calcYTranslation(
  value: Float,
  imageRect: RectF,
  viewRect: RectF,
  isPercentage: Boolean = false,
  isReverse: Boolean = false
): Float = calcTranslation(value, imageRect.height(), viewRect.height(), isPercentage, isReverse)

fun calcTranslation(
  value: Float,
  imageRefValue: Float,
  viewRefValue: Float,
  isPercentage: Boolean = false,
  isReverse: Boolean = false
): Float {
  if (isPercentage) {
    val finalPercentage = if (isReverse) {
      100f - value
    } else {
      value
    }
    return (finalPercentage / 100f) * (viewRefValue - imageRefValue)
  }

  if (isReverse) {
    return viewRefValue - imageRefValue - value
  }

  return value
}
