package expo.modules.facedetector;

import android.content.Context;

import org.unimodules.core.interfaces.InternalModule;

import java.util.Collections;
import java.util.List;

import expo.modules.interfaces.facedetector.FaceDetectorInterface;
import expo.modules.interfaces.facedetector.FaceDetectorProviderInterface;

public class ExpoFaceDetectorProvider implements FaceDetectorProviderInterface, InternalModule {
  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList(FaceDetectorProviderInterface.class);
  }

  public FaceDetectorInterface createFaceDetectorWithContext(Context context) {
    return new ExpoFaceDetector(context);
  }
}
