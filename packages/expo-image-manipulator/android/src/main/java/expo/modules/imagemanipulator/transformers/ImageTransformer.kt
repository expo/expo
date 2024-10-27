package expo.modules.imagemanipulator.transformers

import android.graphics.Bitmap

@FunctionalInterface
interface ImageTransformer {
  fun transform(bitmap: Bitmap): Bitmap
}
