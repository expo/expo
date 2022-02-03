package abi44_0_0.expo.modules.facedetector

import com.google.firebase.ml.vision.face.FirebaseVisionFaceDetectorOptions

const val ALL_CLASSIFICATIONS = FirebaseVisionFaceDetectorOptions.ALL_CLASSIFICATIONS
const val NO_CLASSIFICATIONS = FirebaseVisionFaceDetectorOptions.NO_CLASSIFICATIONS
const val ALL_LANDMARKS = FirebaseVisionFaceDetectorOptions.ALL_LANDMARKS
const val NO_LANDMARKS = FirebaseVisionFaceDetectorOptions.NO_LANDMARKS
const val ACCURATE_MODE = FirebaseVisionFaceDetectorOptions.ACCURATE
const val FAST_MODE = FirebaseVisionFaceDetectorOptions.FAST

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
