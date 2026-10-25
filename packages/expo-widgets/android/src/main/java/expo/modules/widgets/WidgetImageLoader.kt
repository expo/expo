@file:SuppressLint("RestrictedApi")

package expo.modules.widgets

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import android.os.Build
import androidx.glance.ImageProvider
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import expo.modules.ui.graphics.ImageSource
import java.io.FileNotFoundException
import java.io.InputStream
import kotlin.math.max

internal data class WidgetImageTarget(val widthPx: Int, val heightPx: Int)

// RemoteViews rejects a widget update whose bitmaps exceed its memory budget.
private const val MAX_WIDGET_IMAGE_PIXELS = 1_048_576L
private const val MAX_WIDGET_IMAGE_DIMENSION_PX = 2048

internal fun loadWidgetImage(context: Context, source: ImageSource, target: WidgetImageTarget): ImageProvider {
  val uri = Uri.parse(source.uri)
  return when (uri.scheme) {
    null -> ImageProvider(resolveDrawableId(context, source.uri))
    "file", "content", "android.resource" -> ImageProvider(decodeBitmap(context, uri, target))
    "http", "https" -> throw IllegalArgumentException(
      "Remote images are not supported in widgets ('${source.uri}'). Download the image to widgetsDirectory from the app and pass its file URI."
    )

    else -> throw IllegalArgumentException(
      "Image URI scheme '${uri.scheme}' is not supported in widgets ('${source.uri}'). Pass a drawable resource name or a file URI."
    )
  }
}

private fun resolveDrawableId(context: Context, name: String): Int {
  val resourceId = ResourceDrawableIdHelper.getResourceDrawableId(context, name)
  require(resourceId > 0) {
    "Image resource '$name' was not found in the app's drawables. Add it to the app's res/drawable directory or pass a file URI."
  }
  return resourceId
}

private fun decodeBitmap(context: Context, uri: Uri, target: WidgetImageTarget): Bitmap {
  return runCatching {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      ImageDecoder.decodeBitmap(ImageDecoder.createSource(context.contentResolver, uri)) { decoder, info, _ ->
        decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
        decoder.setTargetSampleSize(calculateInSampleSize(info.size.width, info.size.height, target))
      }
    } else {
      decodeWithBitmapFactory(context, uri, target)
    }
  }.getOrElse { error ->
    throw IllegalArgumentException(
      if (error is FileNotFoundException) {
        "Image '$uri' does not exist. Copy the image to widgetsDirectory before updating the widget."
      } else {
        "Image '$uri' could not be decoded. Widgets support bitmap formats such as PNG, JPEG and WebP."
      },
      error
    )
  }
}

private fun decodeWithBitmapFactory(context: Context, uri: Uri, target: WidgetImageTarget): Bitmap {
  val open: () -> InputStream = {
    context.contentResolver.openInputStream(uri) ?: throw FileNotFoundException(uri.toString())
  }
  val orientation = open().use { input ->
    runCatching {
      ExifInterface(input).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
    }.getOrDefault(ExifInterface.ORIENTATION_NORMAL)
  }
  val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
  open().use { input -> BitmapFactory.decodeStream(input, null, bounds) }
  require(bounds.outWidth > 0 && bounds.outHeight > 0) { "Image '$uri' has no decodable bounds." }

  val swapsDimensions = orientation.swapsDimensions()
  val options = BitmapFactory.Options().apply {
    inSampleSize = calculateInSampleSize(
      sourceWidth = if (swapsDimensions) {
        bounds.outHeight
      } else {
        bounds.outWidth
      },
      sourceHeight = if (swapsDimensions) {
        bounds.outWidth
      } else {
        bounds.outHeight
      },
      target = target
    )
  }
  val bitmap = requireNotNull(open().use { input -> BitmapFactory.decodeStream(input, null, options) }) {
    "Image '$uri' could not be decoded."
  }
  return bitmap.applyExifOrientation(orientation)
}

private fun calculateInSampleSize(sourceWidth: Int, sourceHeight: Int, target: WidgetImageTarget): Int {
  val targetWidth = target.widthPx.coerceAtLeast(1)
  val targetHeight = target.heightPx.coerceAtLeast(1)
  var sampleSize = 1
  while (sourceWidth / (sampleSize * 2) >= targetWidth && sourceHeight / (sampleSize * 2) >= targetHeight) {
    sampleSize *= 2
  }
  while (
    (sourceWidth.toLong() / sampleSize) * (sourceHeight.toLong() / sampleSize) > MAX_WIDGET_IMAGE_PIXELS ||
    max(sourceWidth, sourceHeight) / sampleSize > MAX_WIDGET_IMAGE_DIMENSION_PX
  ) {
    sampleSize *= 2
  }
  return sampleSize
}

private fun Bitmap.applyExifOrientation(orientation: Int): Bitmap {
  val matrix = Matrix()
  when (orientation) {
    ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.setScale(-1f, 1f)
    ExifInterface.ORIENTATION_ROTATE_180 -> matrix.setRotate(180f)
    ExifInterface.ORIENTATION_FLIP_VERTICAL -> {
      matrix.setRotate(180f)
      matrix.postScale(-1f, 1f)
    }

    ExifInterface.ORIENTATION_TRANSPOSE -> {
      matrix.setRotate(90f)
      matrix.postScale(-1f, 1f)
    }

    ExifInterface.ORIENTATION_ROTATE_90 -> matrix.setRotate(90f)
    ExifInterface.ORIENTATION_TRANSVERSE -> {
      matrix.setRotate(-90f)
      matrix.postScale(-1f, 1f)
    }

    ExifInterface.ORIENTATION_ROTATE_270 -> matrix.setRotate(-90f)
    else -> return this
  }
  return Bitmap.createBitmap(this, 0, 0, width, height, matrix, true).also { oriented ->
    if (oriented !== this) {
      recycle()
    }
  }
}

private fun Int.swapsDimensions(): Boolean {
  return this == ExifInterface.ORIENTATION_TRANSPOSE ||
    this == ExifInterface.ORIENTATION_ROTATE_90 ||
    this == ExifInterface.ORIENTATION_TRANSVERSE ||
    this == ExifInterface.ORIENTATION_ROTATE_270
}
