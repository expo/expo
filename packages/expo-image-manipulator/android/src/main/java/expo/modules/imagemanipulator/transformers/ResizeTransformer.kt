package expo.modules.imagemanipulator.transformers

import android.graphics.Bitmap
import expo.modules.imagemanipulator.ResizeOptions

class ResizeTransformer(
  private val resizeOptions: ResizeOptions
) : ImageTransformer {
  override fun transform(bitmap: Bitmap): Bitmap {
    var targetWidth = 0
    var targetHeight = 0

    val imageRatio = bitmap.width.toDouble() / bitmap.height.toDouble()

    if (resizeOptions.width != null) {
      targetWidth = resizeOptions.width
      targetHeight = (resizeOptions.width / imageRatio).toInt()
    }

    if (resizeOptions.height != null) {
      targetHeight = resizeOptions.height
      targetWidth = if (targetWidth == 0) (resizeOptions.height * imageRatio).toInt() else targetWidth
    }

    return Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
  }
}
