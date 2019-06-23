package abi32_0_0.expo.modules.facedetector;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi32_0_0.expo.core.interfaces.InternalModule;
import abi32_0_0.expo.interfaces.facedetector.FaceDetector;
import abi32_0_0.expo.interfaces.facedetector.FaceDetectorProvider;

public class ExpoFaceDetectorProvider implements FaceDetectorProvider, InternalModule {
  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) FaceDetectorProvider.class);
  }

  public FaceDetector createFaceDetectorWithContext(Context context) {
    return new ExpoFaceDetector(context);
  }
}
