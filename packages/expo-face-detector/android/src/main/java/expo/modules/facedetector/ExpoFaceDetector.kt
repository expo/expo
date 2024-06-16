package expo.modules.facedetector

import android.content.Context
import android.net.Uri
import android.os.Bundle
import androidx.arch.core.util.Function

import com.google.android.gms.tasks.OnCompleteListener
import com.google.android.gms.tasks.Task
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.common.InputImage.IMAGE_FORMAT_NV21
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetector
import com.google.mlkit.vision.face.FaceDetectorOptions

import expo.modules.facedetector.FaceDetectorUtils.serializeFace
import expo.modules.facedetector.FaceDetectorUtils.rotateFaceX
import expo.modules.interfaces.facedetector.FaceDetectorInterface
import expo.modules.interfaces.facedetector.FacesDetectionCompleted
import expo.modules.interfaces.facedetector.FaceDetectionError
import expo.modules.interfaces.facedetector.FaceDetectionSkipped
import expo.modules.interfaces.facedetector.FaceDetectionUnspecifiedError

import java.io.IOException
import java.util.ArrayList

private const val DETECT_LANDMARKS_KEY = "detectLandmarks"
private const val MIN_INTERVAL_MILLIS_KEY = "minDetectionInterval"
private const val MODE_KEY = "mode"
private const val RUN_CLASSIFICATIONS_KEY = "runClassifications"
private const val TRACKING_KEY = "tracking"

class ExpoFaceDetector(private val context: Context) : FaceDetectorInterface {
  private var faceDetector: FaceDetector? = null
  private val minFaceSize = 0.15f
  private var minDetectionInterval: Long = 0
  private var lastDetectionMillis: Long = 0
  private var tracking = false
    set(value) {
      if (field != value) {
        release()
        field = value
      }
    }
  private var landmarkType = NO_LANDMARKS
    set(value) {
      if (field != value) {
        release()
        field = value
      }
    }
  private var classificationType = NO_CLASSIFICATIONS
    set(value) {
      if (field != value) {
        release()
        field = value
      }
    }
  private var mode = FAST_MODE
    set(value) {
      if (field != value) {
        release()
        field = value
      }
    }

  // Public API
  @Throws(IOException::class)
  override fun detectFaces(filePath: Uri, complete: FacesDetectionCompleted, error: FaceDetectionError) {
    if (faceDetector == null) {
      createFaceDetector()
    }
    val image = InputImage.fromFilePath(context, filePath)
    faceDetector?.process(image)
      ?.addOnCompleteListener(
        faceDetectionHandler(FaceDetectorUtils::serializeFace, complete, error)
      )
  }

  override fun detectFaces(
    imageData: ByteArray,
    width: Int,
    height: Int,
    rotation: Int,
    mirrored: Boolean,
    scaleX: Double,
    scaleY: Double,
    complete: FacesDetectionCompleted,
    error: FaceDetectionError,
    skipped: FaceDetectionSkipped
  ) {
    if (imageData.isEmpty() || width <= 0 || height <= 0) {
      skipped.onSkipped("Skipped frame due to invalid data.")
      return
    }
    if (faceDetector == null) {
      createFaceDetector()
    }
    val image = InputImage.fromByteArray(imageData, width, height, rotation, IMAGE_FORMAT_NV21)
    if (minDetectionInterval <= 0 || minIntervalPassed()) {
      lastDetectionMillis = System.currentTimeMillis()
      faceDetector?.process(image)
        ?.addOnCompleteListener(
          faceDetectionHandler(
            { face ->
              var result = serializeFace(face, scaleX, scaleY)
              if (mirrored) {
                result = if (rotation == 270 || rotation == 90) {
                  rotateFaceX(result, height, scaleX)
                } else {
                  rotateFaceX(result, width, scaleX)
                }
              }
              result
            },
            complete,
            error
          )
        )
    } else {
      skipped.onSkipped("Skipped frame due to time interval.")
    }
  }

  private fun faceDetectionHandler(transformer: Function<Face, Bundle>, complete: FacesDetectionCompleted, error: FaceDetectionError): OnCompleteListener<List<Face>?> =
    OnCompleteListener { task: Task<List<Face>?> ->
      if (task.isComplete && task.isSuccessful) {
        val facesArray = ArrayList<Bundle>().apply {
          val faces = task.result
          faces?.forEach { face -> add(transformer.apply(face)) }
        }
        complete.detectionCompleted(facesArray)
      } else {
        error.onError(FaceDetectionUnspecifiedError())
      }
    }

  private fun minIntervalPassed() = lastDetectionMillis + minDetectionInterval < System.currentTimeMillis()

  override fun setSettings(settings: Map<String, Any>) {
    if (settings[MODE_KEY] is Number) {
      mode = (settings[MODE_KEY] as Number).toInt()
    }
    if (settings[DETECT_LANDMARKS_KEY] is Number) {
      landmarkType = (settings[DETECT_LANDMARKS_KEY] as Number).toInt()
    }
    if (settings[TRACKING_KEY] is Boolean) {
      tracking = (settings[TRACKING_KEY] as Boolean)
    }
    if (settings[RUN_CLASSIFICATIONS_KEY] is Number) {
      classificationType = (settings[RUN_CLASSIFICATIONS_KEY] as Number).toInt()
    }
    minDetectionInterval = if (settings[MIN_INTERVAL_MILLIS_KEY] is Number) {
      (settings[MIN_INTERVAL_MILLIS_KEY] as Number).toInt().toLong()
    } else {
      0
    }
  }

  override fun release() {
    releaseFaceDetector()
  }

  // Lifecycle methods
  private fun releaseFaceDetector() {
    faceDetector = null
  }

  private fun createFaceDetector() {
    faceDetector = FaceDetection.getClient(createOptions())
  }

  private fun createOptions(): FaceDetectorOptions {
    val builder = FaceDetectorOptions.Builder()
      .setClassificationMode(classificationType)
      .setLandmarkMode(landmarkType)
      .setPerformanceMode(mode)
      .setMinFaceSize(minFaceSize)
    if (tracking) {
      builder.enableTracking()
    }
    return builder.build()
  }
}
