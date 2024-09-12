package expo.modules.imagemanipulator

import android.graphics.Bitmap
import expo.modules.kotlin.RuntimeContext
import expo.modules.kotlin.sharedobjects.SharedRef

class ImageRef(bitmap: Bitmap, runtimeContext: RuntimeContext) : SharedRef<Bitmap>(bitmap, runtimeContext)
