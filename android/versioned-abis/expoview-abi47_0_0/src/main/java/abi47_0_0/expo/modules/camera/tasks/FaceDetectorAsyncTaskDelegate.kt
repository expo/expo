package abi47_0_0.expo.modules.camera.tasks

import android.os.Bundle
import abi47_0_0.expo.modules.interfaces.facedetector.FaceDetectorInterface

interface FaceDetectorAsyncTaskDelegate {
  fun onFacesDetected(faces: List<Bundle>)
  fun onFaceDetectionError(faceDetector: FaceDetectorInterface)
  fun onFaceDetectingTaskCompleted()
}
