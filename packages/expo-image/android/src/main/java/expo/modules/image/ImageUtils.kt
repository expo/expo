package expo.modules.image

import android.content.res.Resources
import android.graphics.Bitmap
import android.graphics.Canvas
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
