package abi28_0_0.host.exp.exponent.modules.api.components.camera.tasks;

import android.util.SparseArray;

import com.google.android.gms.vision.face.Face;

import abi28_0_0.host.exp.exponent.modules.api.components.facedetector.ExpoFaceDetector;

public interface FaceDetectorAsyncTaskDelegate {
  void onFacesDetected(SparseArray<Face> face, int sourceWidth, int sourceHeight, int sourceRotation);
  void onFaceDetectionError(ExpoFaceDetector faceDetector);
  void onFaceDetectingTaskCompleted();
}
