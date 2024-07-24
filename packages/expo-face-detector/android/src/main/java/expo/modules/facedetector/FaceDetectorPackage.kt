package expo.modules.facedetector

import android.content.Context
import expo.modules.core.BasePackage

class FaceDetectorPackage : BasePackage() {
  override fun createInternalModules(context: Context) =
    listOf(ExpoFaceDetectorProvider())
}
