
package expo.modules.facedetector;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.BasePackage;
import org.unimodules.core.interfaces.InternalModule;

public class FaceDetectorPackage extends BasePackage {
  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.singletonList((InternalModule) new FaceDetectorProvider());
  }

  @Override
  public List<ExportedModule> createExportedModules(Context reactContext) {
    return Collections.singletonList((ExportedModule) new FaceDetectorModule(reactContext));
  }
}
