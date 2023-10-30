package expo.modules.facedetector

import android.content.Context
import android.os.Bundle
import expo.modules.facedetector.tasks.FileFaceDetectionCompletionListener
import expo.modules.facedetector.tasks.FileFaceDetectionTask
import expo.modules.interfaces.facedetector.FaceDetectorInterface
import expo.modules.interfaces.facedetector.FaceDetectorProviderInterface
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FaceDetectorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoFaceDetector")

    Constants(
      "Mode" to faceDetectionModeConstants,
      "Landmarks" to faceDetectionLandmarksConstants,
      "Classifications" to faceDetectionClassificationsConstants
    )

    AsyncFunction("detectFaces") { options: HashMap<String, Any>, promise: Promise ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val detector = detectorForOptions(options, context)
      FileFaceDetectionTask(
        detector,
        options,
        object : FileFaceDetectionCompletionListener {
          override fun resolve(result: Bundle) = promise.resolve(result)
          override fun reject(tag: String, message: String) = promise.reject(tag, message, null)
        }
      ).execute()
    }
  }

  private fun detectorForOptions(
    options: HashMap<String, Any>,
    context: Context
  ): FaceDetectorInterface {
    val faceDetectorProvider = appContext.legacyModule<FaceDetectorProviderInterface>()
      ?: throw Exceptions.ModuleNotFound(FaceDetectorProviderInterface::class)

    return faceDetectorProvider.createFaceDetectorWithContext(context).apply {
      setSettings(options)
    }
  }
}
