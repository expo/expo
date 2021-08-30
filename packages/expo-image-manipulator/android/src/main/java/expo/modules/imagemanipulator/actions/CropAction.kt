package expo.modules.imagemanipulator.actions

import android.graphics.Bitmap

private const val KEY_ORIGIN_X = "originX"
private const val KEY_ORIGIN_Y = "originY"
private const val KEY_WIDTH = "width"
private const val KEY_HEIGHT = "height"

class CropAction(private val originX: Int, private val originY: Int, private val width: Int, private val height: Int) : Action {
  override fun run(bitmap: Bitmap): Bitmap {
    require(
      originX <= bitmap.width &&
        originY <= bitmap.height &&
        originX + width <= bitmap.width &&
        originY + height <= bitmap.height
    ) { "Invalid crop options have been passed. Please make sure the requested crop rectangle is inside source image." }
    return Bitmap.createBitmap(bitmap, originX, originY, width, height)
  }

  companion object {
    fun fromObject(o: Any): CropAction {
      require(o is Map<*, *>)
      val originX = (o[KEY_ORIGIN_X] as Double).toInt()
      val originY = (o[KEY_ORIGIN_Y] as Double).toInt()
      val width = (o[KEY_WIDTH] as Double).toInt()
      val height = (o[KEY_HEIGHT] as Double).toInt()
      return CropAction(originX, originY, width, height)
    }
  }
}
