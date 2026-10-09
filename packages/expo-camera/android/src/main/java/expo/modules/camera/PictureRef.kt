package expo.modules.camera

import android.graphics.Bitmap
import expo.modules.kotlin.runtime.Runtime
import expo.modules.kotlin.sharedobjects.SharedRef

class PictureRef(bitmap: Bitmap, runtime: Runtime) : SharedRef<Bitmap>(bitmap, runtime) {
  override val nativeRefType: String = "image"

  override fun getAdditionalMemoryPressure(): Int {
    return ref.allocationByteCount
  }
}
