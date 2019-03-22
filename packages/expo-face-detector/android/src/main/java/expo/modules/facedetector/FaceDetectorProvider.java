package expo.modules.facedetector;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.interfaces.InternalModule;
import org.unimodules.interfaces.facedetector.FaceDetector;

public class FaceDetectorProvider implements org.unimodules.interfaces.facedetector.FaceDetectorProvider, InternalModule {
  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) org.unimodules.interfaces.facedetector.FaceDetectorProvider.class);
  }

  public FaceDetector createFaceDetectorWithContext(Context context) {
    return new ExpoFaceDetector(context);
  }
}
