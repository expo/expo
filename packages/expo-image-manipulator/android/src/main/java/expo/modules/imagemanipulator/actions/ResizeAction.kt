package expo.modules.imagemanipulator.actions

import android.graphics.Bitmap
import expo.modules.imagemanipulator.ResizeOptions

class ResizeAction(private val resizeOptions: ResizeOptions) : Action {
  override fun run(bitmap: Bitmap): Bitmap {
    val width = resizeOptions.width?.toInt()
    val height = resizeOptions.height?.toInt()
    val currentImageRatio = bitmap.width.toFloat() / bitmap.height
    val newWidth = width ?: (resizeOptions.height!! * currentImageRatio).toInt()
    val newHeight = height ?: (resizeOptions.width!! / currentImageRatio).toInt()
    return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
  }
}
