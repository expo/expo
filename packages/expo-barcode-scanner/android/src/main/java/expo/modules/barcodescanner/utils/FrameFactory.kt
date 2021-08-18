package expo.modules.barcodescanner.utils

import android.graphics.Bitmap
import android.graphics.ImageFormat
import java.nio.ByteBuffer

object FrameFactory {
  fun buildFrame(bitmapData: ByteArray, width: Int, height: Int, rotation: Int): Frame {
    val builder = com.google.android.gms.vision.Frame.Builder()
    val byteBuffer = ByteBuffer.wrap(bitmapData)
    builder.setImageData(byteBuffer, width, height, ImageFormat.NV21)
    when (rotation) {
      90 -> builder.setRotation(com.google.android.gms.vision.Frame.ROTATION_90)
      180 -> builder.setRotation(com.google.android.gms.vision.Frame.ROTATION_180)
      270 -> builder.setRotation(com.google.android.gms.vision.Frame.ROTATION_270)
      else -> builder.setRotation(com.google.android.gms.vision.Frame.ROTATION_0)
    }
    val dimensions = ImageDimensions(width, height, rotation)
    return Frame(builder.build(), dimensions)
  }

  fun buildFrame(bitmap: Bitmap): Frame {
    val builder = com.google.android.gms.vision.Frame.Builder()
    builder.setBitmap(bitmap)
    val dimensions = ImageDimensions(bitmap.width, bitmap.height)
    return Frame(builder.build(), dimensions)
  }
}
