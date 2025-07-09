package expo.modules.imagemanipulator

import android.graphics.Bitmap
import expo.modules.kotlin.RuntimeContext
import expo.modules.kotlin.sharedobjects.SharedRef

class ImageRef(bitmap: Bitmap, runtimeContext: RuntimeContext) : SharedRef<Bitmap>(bitmap, runtimeContext) {
  override val nativeRefType: String = "image"

  override fun getAdditionalMemoryPressure(): Int {
    return ref.allocationByteCount
  }
}
