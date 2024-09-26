package expo.modules.imagemanipulator.transformers

import android.graphics.Bitmap
import expo.modules.imagemanipulator.CropRect
import expo.modules.imagemanipulator.ImageInvalidCropException

class CropTransformer(
  private val rect: CropRect
) : ImageTransformer {
  override fun transform(bitmap: Bitmap): Bitmap {
    val isInBounds = rect.originX <= bitmap.width &&
      rect.originY <= bitmap.height &&
      rect.width <= bitmap.width &&
      rect.height <= bitmap.height
    if (!isInBounds) {
      throw ImageInvalidCropException()
    }

    return Bitmap.createBitmap(bitmap, rect.originX.toInt(), rect.originY.toInt(), rect.width.toInt(), rect.height.toInt())
  }
}
