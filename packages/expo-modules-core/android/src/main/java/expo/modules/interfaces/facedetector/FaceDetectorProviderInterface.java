package expo.modules.interfaces.facedetector;

import android.content.Context;

public interface FaceDetectorProviderInterface {
  FaceDetectorInterface createFaceDetectorWithContext(Context context);
}
