package abi47_0_0.expo.modules.facedetector

import com.google.mlkit.vision.face.FaceDetectorOptions

const val ALL_CLASSIFICATIONS = FaceDetectorOptions.CLASSIFICATION_MODE_ALL
const val NO_CLASSIFICATIONS = FaceDetectorOptions.CLASSIFICATION_MODE_NONE
const val ALL_LANDMARKS = FaceDetectorOptions.LANDMARK_MODE_ALL
const val NO_LANDMARKS = FaceDetectorOptions.LANDMARK_MODE_NONE
const val ACCURATE_MODE = FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE
const val FAST_MODE = FaceDetectorOptions.PERFORMANCE_MODE_FAST

val faceDetectionModeConstants = mapOf(
  "fast" to FAST_MODE,
  "accurate" to ACCURATE_MODE
)

val faceDetectionClassificationsConstants = mapOf(
  "all" to ALL_CLASSIFICATIONS,
  "none" to NO_CLASSIFICATIONS
)

val faceDetectionLandmarksConstants = mapOf(
  "all" to ALL_LANDMARKS,
  "none" to NO_LANDMARKS
)
