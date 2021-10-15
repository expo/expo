
package abi43_0_0.expo.modules.camera;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi43_0_0.expo.modules.core.ExportedModule;
import abi43_0_0.expo.modules.core.BasePackage;
import abi43_0_0.expo.modules.core.ViewManager;

public class CameraPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new CameraModule(context));
  }

  @Override
  public List<ViewManager> createViewManagers(Context context) {
    return Collections.singletonList((ViewManager) new CameraViewManager());
  }
}
