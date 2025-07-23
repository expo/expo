// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.font

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.Typeface
import android.net.Uri
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
import kotlin.math.abs

private class SaveImageException(uri: String, cause: Throwable? = null) :
  CodedException("Could not save image to '$uri'", cause)

open class FontUtilsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoFontUtils")

    AsyncFunction("renderToImageAsync") { glyphs: String, options: RenderToImageOptions, promise: Promise ->
      val typeface = ReactFontManager.getInstance().getTypeface(options.fontFamily, Typeface.NORMAL, context.assets)

      val paint = Paint().apply {
        this.typeface = typeface
        this.color = options.color
        this.textSize = options.size
        this.isAntiAlias = true
      }

      val bounds = Rect().also {
        paint.getTextBounds(glyphs, 0, glyphs.length, it)
      }

      val bitmap = Bitmap.createBitmap(bounds.width(), bounds.height(), Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bitmap)

      val x = abs(bounds.left).toFloat()
      val y = bounds.height().toFloat() / 2 - ((paint.fontMetrics.ascent + paint.fontMetrics.descent) / 2)

      canvas.drawText(glyphs, x, y, paint)

      val output = File(context.cacheDir, "${UUID.randomUUID()}.png")
      if (!output.exists()) {
        output.createNewFile()
      }

      try {
        FileOutputStream(output).use { out ->
          bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
          promise.resolve(Uri.fromFile(output))
        }
      } catch (e: IOException) {
        promise.reject(SaveImageException(output.absolutePath, e))
      }
    }
  }
}
