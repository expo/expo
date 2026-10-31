// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import androidx.core.net.toUri
import com.facebook.react.common.assets.ReactFontManager
import expo.modules.kotlin.exception.CodedException
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.util.UUID
import kotlin.math.ceil

private class SaveImageException(uri: String, cause: Throwable? = null) :
  CodedException("Could not save image to '$uri'", cause)

@ExpoModule("ExpoFontUtils")
open class FontUtilsModule : Module() {
  @JS
  suspend fun renderToImageAsync(glyphs: String, options: RenderToImageOptions): RenderToImageResult = withContext(Dispatchers.IO) {
    val typeface = ReactFontManager.getInstance().getTypeface(options.fontFamily, Typeface.NORMAL, androidContext.assets)

    val scalingFactor = androidContext.resources.displayMetrics.density
    val scaledSize = options.size * scalingFactor
    val lineHeight = options.lineHeight?.let { it * scalingFactor }
    val paint = Paint().apply {
      this.typeface = typeface
      color = options.color
      textSize = scaledSize
      isAntiAlias = true
    }

    val fontMetrics = paint.fontMetrics

    val width = ceil(paint.measureText(glyphs)).toInt()

    // Calculate height based on font metrics to ensure enough space
    // This gives the maximum height the font might occupy. Could be more than strictly needed but aligns with iOS.
    val height = lineHeight?.toInt() ?: ceil(fontMetrics.descent - fontMetrics.ascent).toInt()

    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)

    val yBaseline = lineHeight?.let {
      // When lineHeight is specified, center the text vertically within that height
      (it - (fontMetrics.descent - fontMetrics.ascent)) / 2f - fontMetrics.ascent
      // The `drawText` method's y-parameter is the baseline of the text.
      // To draw the text starting from the very top of the bitmap,
      // the baseline should be at -fontMetrics.ascent.
      // For most characters, text may appear vertically centered, but try with characters like Å or Ç
    } ?: -fontMetrics.ascent
    canvas.drawText(glyphs, 0f, yBaseline, paint)

    val output = File(androidContext.cacheDir, "${UUID.randomUUID()}.png")

    try {
      FileOutputStream(output).use { out ->
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
      }
    } catch (e: IOException) {
      throw SaveImageException(output.absolutePath, e)
    }

    RenderToImageResult(
      uri = output.toUri().toString(),
      width = bitmap.width / scalingFactor,
      height = bitmap.height / scalingFactor,
      scale = scalingFactor
    )
  }
}
