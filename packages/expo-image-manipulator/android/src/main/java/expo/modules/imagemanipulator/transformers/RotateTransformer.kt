package expo.modules.imagemanipulator.transformers

import android.graphics.Bitmap
import android.graphics.Matrix

class RotateTransformer(private val rotation: Float) : ImageTransformer {
  override fun transform(bitmap: Bitmap): Bitmap {
    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, rotationMatrix, true)
  }

  private val rotationMatrix: Matrix
    get() = Matrix().apply { postRotate(rotation) }
}
