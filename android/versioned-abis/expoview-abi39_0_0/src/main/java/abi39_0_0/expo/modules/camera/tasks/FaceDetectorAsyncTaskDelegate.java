package abi39_0_0.expo.modules.camera.tasks;

import android.os.Bundle;

import java.util.List;

import abi39_0_0.org.unimodules.interfaces.facedetector.FaceDetector;

public interface FaceDetectorAsyncTaskDelegate {
  void onFacesDetected(List<Bundle> faces);
  void onFaceDetectionError(FaceDetector faceDetector);
  void onFaceDetectingTaskCompleted();
}
