package abi34_0_0.expo.modules.facedetector;

import android.content.Context;

import abi34_0_0.org.unimodules.core.interfaces.InternalModule;
import abi34_0_0.org.unimodules.interfaces.facedetector.FaceDetector;

import java.util.Collections;
import java.util.List;

public class ExpoFaceDetectorProvider implements abi34_0_0.org.unimodules.interfaces.facedetector.FaceDetectorProvider, InternalModule {
  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) abi34_0_0.org.unimodules.interfaces.facedetector.FaceDetectorProvider.class);
  }

  public FaceDetector createFaceDetectorWithContext(Context context) {
    return new ExpoFaceDetector(context);
  }
}
