package expo.modules.imagemanipulator.actions

import android.graphics.Bitmap
import expo.modules.imagemanipulator.CropRect

class CropAction(private val rect: CropRect) : Action {
  override fun run(bitmap: Bitmap): Bitmap {
    require(
      rect.originX <= bitmap.width &&
        rect.originY <= bitmap.height &&
        rect.width <= bitmap.width &&
        rect.height <= bitmap.height
    ) { "Invalid crop options have been passed. Please make sure the requested crop rectangle is inside source image." }
    return Bitmap.createBitmap(bitmap, rect.originX.toInt(), rect.originY.toInt(), rect.width.toInt(), rect.height.toInt())
  }
}
