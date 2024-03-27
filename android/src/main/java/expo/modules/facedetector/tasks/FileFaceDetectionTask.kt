package expo.modules.facedetector.tasks

import android.net.Uri
import android.os.Bundle
import androidx.exifinterface.media.ExifInterface

import expo.modules.interfaces.facedetector.FaceDetectorInterface

import java.util.ArrayList
import java.util.HashMap

private const val ERROR_TAG = "E_FACE_DETECTION_FAILED"

class FileFaceDetectionTask(
  private val expoFaceDetector: FaceDetectorInterface,
  options: HashMap<String, Any>,
  private val listener: FileFaceDetectionCompletionListener
) {
  private var width = 0
  private var height = 0
  private var orientation = ExifInterface.ORIENTATION_UNDEFINED
  private val filePath: Uri? = Uri.parse(options["uri"] as String?)

  private fun ensurePath() = when {
    filePath == null -> {
      listener.reject(ERROR_TAG, "You have to provide an URI of an image.")
      false
    }
    filePath.path == null -> {
      listener.reject(ERROR_TAG, "Invalid URI provided: `" + filePath.path + "`.")
      false
    }
    else -> true
  }

  fun execute() {
    if (!ensurePath()) {
      return
    }
    filePath?.path?.let { path ->
      val exif = ExifInterface(path)
      orientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_UNDEFINED)
      if (orientation == ExifInterface.ORIENTATION_ROTATE_270 ||
        orientation == ExifInterface.ORIENTATION_ROTATE_90
      ) {
        width = exif.getAttributeInt(ExifInterface.TAG_IMAGE_LENGTH, ExifInterface.ORIENTATION_UNDEFINED)
        height = exif.getAttributeInt(ExifInterface.TAG_IMAGE_WIDTH, ExifInterface.ORIENTATION_UNDEFINED)
      } else {
        width = exif.getAttributeInt(ExifInterface.TAG_IMAGE_WIDTH, ExifInterface.ORIENTATION_UNDEFINED)
        height = exif.getAttributeInt(ExifInterface.TAG_IMAGE_LENGTH, ExifInterface.ORIENTATION_UNDEFINED)
      }
      expoFaceDetector.detectFaces(filePath, { faces: ArrayList<Bundle> -> processFaces(faces) }) { error: Throwable -> detectionError(error) }
    } ?: run {
      listener.reject(ERROR_TAG, "Problem while accessing file: `$filePath`.")
    }
  }

  private fun processFaces(faces: ArrayList<Bundle>) {
    resolveWithFaces(faces)
  }

  private fun detectionError(error: Throwable) {
    listener.reject(ERROR_TAG, "Unable to detect faces!")
  }

  private fun resolveWithFaces(faces: ArrayList<Bundle>) {
    val result = Bundle().apply {
      putParcelableArrayList("faces", faces)
      val image = Bundle().apply {
        putInt("width", width)
        putInt("height", height)
        putInt("orientation", orientation)
        putString("uri", filePath?.path)
      }
      putBundle("image", image)
    }
    expoFaceDetector.release()
    listener.resolve(result)
  }
}
