package expo.modules.facedetector;

import android.content.Context;

import expo.modules.core.BasePackage;
import expo.modules.core.ExportedModule;
import expo.modules.core.interfaces.InternalModule;

import java.util.Collections;
import java.util.List;

public class FaceDetectorPackage extends BasePackage {
  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.singletonList((InternalModule) new ExpoFaceDetectorProvider());
  }

  @Override
  public List<ExportedModule> createExportedModules(Context reactContext) {
    return Collections.singletonList((ExportedModule) new FaceDetectorModule(reactContext));
  }
}
