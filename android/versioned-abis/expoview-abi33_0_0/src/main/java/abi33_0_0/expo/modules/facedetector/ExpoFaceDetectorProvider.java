package abi33_0_0.expo.modules.facedetector;

import android.content.Context;

import abi33_0_0.org.unimodules.core.interfaces.InternalModule;
import abi33_0_0.org.unimodules.interfaces.facedetector.FaceDetector;
import abi33_0_0.org.unimodules.interfaces.facedetector.FaceDetectorProvider;

import java.util.Collections;
import java.util.List;

public class ExpoFaceDetectorProvider implements FaceDetectorProvider, InternalModule {
  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) FaceDetectorProvider.class);
  }

  public FaceDetector createFaceDetectorWithContext(Context context) {
    return new ExpoFaceDetector(context);
  }
}
