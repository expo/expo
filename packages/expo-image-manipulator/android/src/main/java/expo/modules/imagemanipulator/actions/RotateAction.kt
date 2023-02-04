package expo.modules.imagemanipulator.actions

import android.graphics.Bitmap
import android.graphics.Matrix

class RotateAction(private val rotation: Int) : Action {
  override fun run(bitmap: Bitmap): Bitmap {
    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, rotationMatrix, true)
  }

  private val rotationMatrix: Matrix
    get() = Matrix().apply { postRotate(rotation.toFloat()) }
}
