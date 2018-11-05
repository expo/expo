package expo.interfaces.facedetector;

import android.content.Context;

public interface FaceDetectorProvider {
  FaceDetector createFaceDetectorWithContext(Context context);
}
