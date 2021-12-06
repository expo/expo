package abi44_0_0.expo.modules.facedetector

import android.os.Bundle
import com.google.android.gms.vision.face.Landmark
import com.google.firebase.ml.vision.face.FirebaseVisionFace
import com.google.firebase.ml.vision.common.FirebaseVisionPoint

object FaceDetectorUtils {
  @JvmStatic
  @JvmOverloads
  fun serializeFace(face: FirebaseVisionFace, scaleX: Double = 1.0, scaleY: Double = 1.0): Bundle {
    val encodedFace = Bundle().apply {
      putInt("faceID", face.trackingId)
      putDouble("rollAngle", face.headEulerAngleZ.toDouble())
      putDouble("yawAngle", face.headEulerAngleY.toDouble())

      if (face.smilingProbability >= 0) {
        putDouble("smilingProbability", face.smilingProbability.toDouble())
      }
      if (face.leftEyeOpenProbability >= 0) {
        putDouble("leftEyeOpenProbability", face.leftEyeOpenProbability.toDouble())
      }
      if (face.rightEyeOpenProbability >= 0) {
        putDouble("rightEyeOpenProbability", face.rightEyeOpenProbability.toDouble())
      }

      LandmarkId.values()
        .forEach { id ->
          face.getLandmark(id.id)?.let { faceLandmark ->
            putBundle(id.name, mapFromPoint(faceLandmark.position, scaleX, scaleY))
          }
        }

      val box = face.boundingBox
      val origin = Bundle(2).apply {
        putDouble("x", box.left * scaleX)
        putDouble("y", box.top * scaleY)
      }

      val size = Bundle(2).apply {
        putDouble("width", (box.right - box.left) * scaleX)
        putDouble("height", (box.bottom - box.top) * scaleY)
      }

      val bounds = Bundle(2).apply {
        putBundle("origin", origin)
        putBundle("size", size)
      }
      putBundle("bounds", bounds)
    }
    return mirrorRollAngle(encodedFace)
  }

  @JvmStatic
  fun rotateFaceX(face: Bundle, sourceWidth: Int, scaleX: Double): Bundle {
    val faceBounds = face.getBundle("bounds") as Bundle
    val oldOrigin = faceBounds.getBundle("origin")
    val mirroredOrigin = positionMirroredHorizontally(oldOrigin, sourceWidth, scaleX)
    val translateX = - (faceBounds.getBundle("size") as Bundle).getDouble("width")
    val translatedMirroredOrigin = positionTranslatedHorizontally(mirroredOrigin, translateX)
    val newBounds = Bundle(faceBounds).apply {
      putBundle("origin", translatedMirroredOrigin)
    }
    face.apply {
      LandmarkId.values().forEach { id ->
        face.getBundle(id.name)?.let { landmark ->
          val mirroredPosition = positionMirroredHorizontally(landmark, sourceWidth, scaleX)
          putBundle(id.name, mirroredPosition)
        }
      }
      putBundle("bounds", newBounds)
    }
    return mirrorYawAngle(mirrorRollAngle(face))
  }

  private fun mirrorRollAngle(face: Bundle) = face.apply {
    putDouble("rollAngle", (-face.getDouble("rollAngle") + 360) % 360)
  }

  private fun mirrorYawAngle(face: Bundle) = face.apply {
    putDouble("yawAngle", (-face.getDouble("yawAngle") + 360) % 360)
  }

  private fun mapFromPoint(point: FirebaseVisionPoint, scaleX: Double, scaleY: Double) = Bundle().apply {
    putDouble("x", point.x * scaleX)
    putDouble("y", point.y * scaleY)
  }

  private fun positionTranslatedHorizontally(position: Bundle, translateX: Double) =
    Bundle(position).apply {
      putDouble("x", position.getDouble("x") + translateX)
    }

  private fun positionMirroredHorizontally(position: Bundle?, containerWidth: Int, scaleX: Double) =
    Bundle(position).apply {
      putDouble("x", valueMirroredHorizontally(position!!.getDouble("x"), containerWidth, scaleX))
    }

  private fun valueMirroredHorizontally(elementX: Double, containerWidth: Int, scaleX: Double) =
    -elementX + containerWidth * scaleX

  // All the landmarks reported by Google Mobile Vision in constants' order.
  // https://developers.google.com/android/reference/com/google/android/gms/vision/face/Landmark
  private enum class LandmarkId(val id: Int, val landmarkName: String) {
    BOTTOM_MOUTH(Landmark.BOTTOM_MOUTH, "bottomMouthPosition"),
    LEFT_CHEEK(Landmark.LEFT_CHEEK, "leftCheekPosition"),
    LEFT_EAR(Landmark.LEFT_EAR, "leftEarPosition"),
    LEFT_EAR_TIP(Landmark.LEFT_EAR_TIP, "leftEarTipPosition"),
    LEFT_EYE(Landmark.LEFT_EYE, "leftEyePosition"),
    LEFT_MOUTH(Landmark.LEFT_MOUTH, "leftMouthPosition"),
    NOSE_BASE(Landmark.NOSE_BASE, "noseBasePosition"),
    RIGHT_CHEEK(Landmark.RIGHT_CHEEK, "rightCheekPosition"),
    RIGHT_EAR(Landmark.RIGHT_EAR, "rightEarPosition"),
    RIGHT_EAR_TIP(Landmark.RIGHT_EAR_TIP, "rightEarTipPosition"),
    RIGHT_EYE(Landmark.RIGHT_EYE, "rightEyePosition"),
    RIGHT_MOUTH(Landmark.RIGHT_MOUTH, "rightMouthPosition");
  }
}
