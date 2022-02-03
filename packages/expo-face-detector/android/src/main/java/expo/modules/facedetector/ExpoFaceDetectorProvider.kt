package expo.modules.facedetector

import android.content.Context
import expo.modules.core.interfaces.InternalModule
import expo.modules.interfaces.facedetector.FaceDetectorProviderInterface

class ExpoFaceDetectorProvider : FaceDetectorProviderInterface, InternalModule {
  override fun getExportedInterfaces() = listOf(FaceDetectorProviderInterface::class.java)

  override fun createFaceDetectorWithContext(context: Context) = ExpoFaceDetector(context)
}
