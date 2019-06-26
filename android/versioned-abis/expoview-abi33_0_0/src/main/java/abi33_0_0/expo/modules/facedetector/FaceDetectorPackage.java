package abi33_0_0.expo.modules.facedetector;

import android.content.Context;

import abi33_0_0.org.unimodules.core.ExportedModule;
import abi33_0_0.org.unimodules.core.interfaces.InternalModule;
import abi33_0_0.org.unimodules.core.interfaces.Package;

import java.util.Collections;
import java.util.List;

public class FaceDetectorPackage implements Package {

  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.singletonList((InternalModule) new ExpoFaceDetectorProvider());
  }

  @Override
  public List<ExportedModule> createExportedModules(Context reactContext) {
    return Collections.singletonList((ExportedModule) new FaceDetectorModule(reactContext));
  }
}
