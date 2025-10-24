// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import androidx.core.net.toUri
import com.facebook.react.common.assets.ReactFontManager
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.util.UUID
import kotlin.math.ceil

private class SaveImageException(uri: String, cause: Throwable? = null) :
  CodedException("Could not save image to '$uri'", cause)

open class FontUtilsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoFontUtils")

    AsyncFunction("renderToImageAsync") { glyphs: String, options: RenderToImageOptions, promise: Promise ->
      val typeface = ReactFontManager.getInstance().getTypeface(options.fontFamily, Typeface.NORMAL, context.assets)

      val scalingFactor = context.resources.displayMetrics.density
      val scaledSize = options.size * scalingFactor
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
      val height = ceil(fontMetrics.descent - fontMetrics.ascent).toInt()

      val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bitmap)

      // The `drawText` method's y-parameter is the baseline of the text.
      // To draw the text starting from the very top of the bitmap,
      // the baseline should be at -fontMetrics.ascent.
      // For most characters, text may appear vertically centered, but try with characters like Å or Ç
      val yBaseline = -fontMetrics.ascent
      canvas.drawText(glyphs, 0f, yBaseline, paint)

      val output = File(context.cacheDir, "${UUID.randomUUID()}.png")

      try {
        FileOutputStream(output).use { out ->
          bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
        }
        promise.resolve(
          mapOf(
            "uri" to output.toUri().toString(),
            "width" to bitmap.width / scalingFactor,
            "height" to bitmap.height / scalingFactor,
            "scale" to scalingFactor
          )
        )
      } catch (e: IOException) {
        promise.reject(SaveImageException(output.absolutePath, e))
      }
    }
  }
}
