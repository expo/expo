package expo.modules.imagemanipulator

import android.graphics.Bitmap
import expo.modules.kotlin.runtime.Runtime
import expo.modules.kotlin.sharedobjects.SharedRef

class ImageRef(bitmap: Bitmap, runtime: Runtime) : SharedRef<Bitmap>(bitmap, runtime) {
  override val nativeRefType: String = "image"

  override fun getAdditionalMemoryPressure(): Int {
    return ref.allocationByteCount
  }
}
