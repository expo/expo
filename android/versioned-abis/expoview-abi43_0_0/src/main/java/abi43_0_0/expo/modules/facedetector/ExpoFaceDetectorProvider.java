package abi43_0_0.expo.modules.facedetector;

import android.content.Context;

import abi43_0_0.expo.modules.core.interfaces.InternalModule;

import java.util.Collections;
import java.util.List;

import abi43_0_0.expo.modules.interfaces.facedetector.FaceDetectorInterface;
import abi43_0_0.expo.modules.interfaces.facedetector.FaceDetectorProviderInterface;

public class ExpoFaceDetectorProvider implements FaceDetectorProviderInterface, InternalModule {
  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList(FaceDetectorProviderInterface.class);
  }

  public FaceDetectorInterface createFaceDetectorWithContext(Context context) {
    return new ExpoFaceDetector(context);
  }
}
