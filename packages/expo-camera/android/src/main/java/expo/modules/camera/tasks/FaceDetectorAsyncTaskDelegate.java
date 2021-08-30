package expo.modules.camera.tasks;

import android.os.Bundle;

import java.util.List;

import expo.modules.interfaces.facedetector.FaceDetectorInterface;

public interface FaceDetectorAsyncTaskDelegate {
  void onFacesDetected(List<Bundle> faces);
  void onFaceDetectionError(FaceDetectorInterface faceDetector);
  void onFaceDetectingTaskCompleted();
}
