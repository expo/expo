package abi44_0_0.expo.modules.facedetector

import android.content.Context
import android.net.Uri
import android.os.Bundle
import androidx.arch.core.util.Function

import com.google.android.gms.tasks.OnCompleteListener
import com.google.android.gms.tasks.Task
import com.google.firebase.ml.vision.common.FirebaseVisionImage
import com.google.firebase.ml.vision.common.FirebaseVisionImageMetadata
import com.google.firebase.ml.vision.face.FirebaseVisionFaceDetectorOptions
import com.google.firebase.ml.vision.face.FirebaseVisionFaceDetector
import com.google.firebase.ml.vision.face.FirebaseVisionFace
import com.google.firebase.ml.vision.FirebaseVision

import com.google.firebase.ml.vision.common.FirebaseVisionImageMetadata.ROTATION_0
import com.google.firebase.ml.vision.common.FirebaseVisionImageMetadata.ROTATION_180
import com.google.firebase.ml.vision.common.FirebaseVisionImageMetadata.ROTATION_270
import com.google.firebase.ml.vision.common.FirebaseVisionImageMetadata.ROTATION_90

import abi44_0_0.expo.modules.facedetector.FaceDetectorUtils.serializeFace
import abi44_0_0.expo.modules.facedetector.FaceDetectorUtils.rotateFaceX
import abi44_0_0.expo.modules.interfaces.facedetector.FaceDetectorInterface
import abi44_0_0.expo.modules.interfaces.facedetector.FacesDetectionCompleted
import abi44_0_0.expo.modules.interfaces.facedetector.FaceDetectionError
import abi44_0_0.expo.modules.interfaces.facedetector.FaceDetectionSkipped
import abi44_0_0.expo.modules.interfaces.facedetector.FaceDetectionUnspecifiedError

import java.io.IOException
import java.util.ArrayList

private const val DETECT_LANDMARKS_KEY = "detectLandmarks"
private const val MIN_INTERVAL_MILLIS_KEY = "minDetectionInterval"
private const val MODE_KEY = "mode"
private const val RUN_CLASSIFICATIONS_KEY = "runClassifications"
private const val TRACKING_KEY = "tracking"

class ExpoFaceDetector(private val context: Context) : FaceDetectorInterface {
  private var faceDetector: FirebaseVisionFaceDetector? = null
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
    val image = FirebaseVisionImage.fromFilePath(context, filePath)
    faceDetector?.detectInImage(image)
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
    if (faceDetector == null) {
      createFaceDetector()
    }
    val firRotation = getFirRotation(rotation)
    val metadata = FirebaseVisionImageMetadata.Builder()
      .setWidth(width)
      .setHeight(height)
      .setFormat(FirebaseVisionImageMetadata.IMAGE_FORMAT_NV21)
      .setRotation(firRotation)
      .build()
    val image = FirebaseVisionImage.fromByteArray(imageData, metadata)
    if (minDetectionInterval <= 0 || minIntervalPassed()) {
      lastDetectionMillis = System.currentTimeMillis()
      faceDetector?.detectInImage(image)
        ?.addOnCompleteListener(
          faceDetectionHandler(
            { face ->
              var result = serializeFace(face, scaleX, scaleY)
              if (mirrored) {
                result = if (firRotation == ROTATION_270 || firRotation == ROTATION_90) {
                  rotateFaceX(result, height, scaleX)
                } else {
                  rotateFaceX(result, width, scaleX)
                }
              }
              result
            },
            complete, error
          )
        )
    } else {
      skipped.onSkipped("Skipped frame due to time interval.")
    }
  }

  private fun getFirRotation(rotation: Int) = when ((rotation + 360) % 360) {
    90 -> ROTATION_90
    180 -> ROTATION_180
    270 -> ROTATION_270
    else -> ROTATION_0
  }

  private fun faceDetectionHandler(transformer: Function<FirebaseVisionFace, Bundle>, complete: FacesDetectionCompleted, error: FaceDetectionError): OnCompleteListener<List<FirebaseVisionFace>?> =
    OnCompleteListener { task: Task<List<FirebaseVisionFace>?> ->
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
    faceDetector = FirebaseVision.getInstance().getVisionFaceDetector(createOptions())
  }

  private fun createOptions(): FirebaseVisionFaceDetectorOptions {
    val builder = FirebaseVisionFaceDetectorOptions.Builder()
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
