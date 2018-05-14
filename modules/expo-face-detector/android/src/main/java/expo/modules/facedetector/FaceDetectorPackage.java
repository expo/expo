
package expo.modules.facedetector;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.core.ExportedModule;
import expo.core.BasePackage;
import expo.core.Module;

public class FaceDetectorPackage extends BasePackage {
  @Override
  public List<Module> createModules() {
    return Collections.singletonList((Module) new FaceDetectorProvider());
  }

  @Override
  public List<ExportedModule> createExportedModules(Context reactContext) {
    return Collections.singletonList((ExportedModule) new FaceDetectorModule(reactContext));
  }
}