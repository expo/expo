package abi47_0_0.expo.modules.imagemanipulator.actions

import android.graphics.Bitmap
import android.graphics.Matrix

class FlipAction(private val flipType: FlipType) : Action {
  override fun run(bitmap: Bitmap): Bitmap {
    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, rotationMatrix, true)
  }

  private val rotationMatrix: Matrix
    get() {
      val m = Matrix()
      if (flipType == FlipType.VERTICAL) {
        m.postScale(1f, -1f)
      } else {
        m.postScale(-1f, 1f)
      }
      return m
    }

  companion object {
    fun fromObject(flipTypeString: String): FlipAction {
      val flipType = when (flipTypeString) {
        "horizontal" -> FlipType.HORIZONTAL
        "vertical" -> FlipType.VERTICAL
        else -> FlipType.HORIZONTAL
      }
      return FlipAction(flipType)
    }
  }
}
