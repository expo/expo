package expo.modules.camera.legacy.tasks

import android.os.Bundle
import expo.modules.interfaces.facedetector.FaceDetectorInterface

interface FaceDetectorAsyncTaskDelegate {
  fun onFacesDetected(faces: List<Bundle>)
  fun onFaceDetectionError(faceDetector: FaceDetectorInterface)
  fun onFaceDetectingTaskCompleted()
}
