package expo.modules.imagemanipulator.actions

import android.graphics.Bitmap

private const val KEY_WIDTH = "width"
private const val KEY_HEIGHT = "height"

class ResizeAction(private val width: Int?, private val height: Int?) : Action {
  init {
    require(width != null || height != null) { "At least one of width or height must be set." }
  }

  override fun run(bitmap: Bitmap): Bitmap {
    val currentImageRatio = bitmap.width.toFloat() / bitmap.height
    val newWidth = width ?: (height!! * currentImageRatio).toInt()
    val newHeight = height ?: (width!! / currentImageRatio).toInt()
    return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
  }

  companion object {
    fun fromObject(o: Any): ResizeAction {
      require(o is Map<*, *>)
      val width = if (o.containsKey(KEY_WIDTH)) ((o[KEY_WIDTH] as Double).toInt()) else null
      val height = if (o.containsKey(KEY_HEIGHT)) ((o[KEY_HEIGHT] as Double).toInt()) else null
      return ResizeAction(width, height)
    }
  }
}
