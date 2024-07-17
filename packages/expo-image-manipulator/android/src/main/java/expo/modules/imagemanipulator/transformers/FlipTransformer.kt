package expo.modules.imagemanipulator.transformers

import android.graphics.Bitmap
import android.graphics.Matrix
import expo.modules.imagemanipulator.FlipType

class FlipTransformer(
  private val flipType: FlipType
) : ImageTransformer {
  override fun transform(bitmap: Bitmap): Bitmap {
    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, rotationMatrix, true)
  }

  private val rotationMatrix: Matrix
    get() = Matrix().apply {
      when (flipType) {
        FlipType.VERTICAL -> postScale(1f, -1f)
        FlipType.HORIZONTAL -> postScale(-1f, 1f)
      }
    }
}
