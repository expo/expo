package expo.modules.facedetector;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.core.interfaces.InternalModule;
import expo.interfaces.facedetector.FaceDetector;

public class FaceDetectorProvider implements expo.interfaces.facedetector.FaceDetectorProvider, InternalModule {
  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) expo.interfaces.facedetector.FaceDetectorProvider.class);
  }

  public FaceDetector createFaceDetectorWithContext(Context context) {
    return new ExpoFaceDetector(context);
  }
}
