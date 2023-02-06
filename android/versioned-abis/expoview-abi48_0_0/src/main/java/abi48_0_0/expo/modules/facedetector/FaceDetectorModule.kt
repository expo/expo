package abi48_0_0.expo.modules.facedetector

import android.content.Context
import android.os.Bundle

import abi48_0_0.expo.modules.core.ExportedModule
import abi48_0_0.expo.modules.core.interfaces.ExpoMethod
import abi48_0_0.expo.modules.core.ModuleRegistry
import abi48_0_0.expo.modules.core.ModuleRegistryDelegate
import abi48_0_0.expo.modules.core.Promise
import abi48_0_0.expo.modules.interfaces.facedetector.FaceDetectorInterface
import abi48_0_0.expo.modules.interfaces.facedetector.FaceDetectorProviderInterface
import abi48_0_0.expo.modules.facedetector.tasks.FileFaceDetectionTask
import abi48_0_0.expo.modules.facedetector.tasks.FileFaceDetectionCompletionListener

import java.util.*

private const val TAG = "ExpoFaceDetector"
private const val MODE_OPTION_KEY = "Mode"
private const val DETECT_LANDMARKS_OPTION_KEY = "Landmarks"
private const val RUN_CLASSIFICATIONS_OPTION_KEY = "Classifications"

class FaceDetectorModule(
  context: Context?,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context) {
  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()
  override fun getName() = TAG

  override fun getConstants() = mapOf(
    MODE_OPTION_KEY to faceDetectionModeConstants,
    DETECT_LANDMARKS_OPTION_KEY to faceDetectionLandmarksConstants,
    RUN_CLASSIFICATIONS_OPTION_KEY to faceDetectionClassificationsConstants
  )

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  @ExpoMethod
  fun detectFaces(options: HashMap<String, Any>, promise: Promise) {
    // TODO: Check file scope
    FileFaceDetectionTask(
      detectorForOptions(options, context), options,
      object : FileFaceDetectionCompletionListener {
        override fun resolve(result: Bundle) = promise.resolve(result)
        override fun reject(tag: String, message: String) = promise.reject(tag, message, null)
      }
    ).execute()
  }

  private fun detectorForOptions(options: HashMap<String, Any>, context: Context): FaceDetectorInterface {
    val faceDetectorProvider: FaceDetectorProviderInterface by moduleRegistry()
    val faceDetector = faceDetectorProvider.createFaceDetectorWithContext(context)
    faceDetector.setSettings(options)
    return faceDetector
  }
}
