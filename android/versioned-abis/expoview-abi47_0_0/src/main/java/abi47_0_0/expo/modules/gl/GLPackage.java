package abi47_0_0.expo.modules.gl;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import abi47_0_0.expo.modules.core.ExportedModule;
import abi47_0_0.expo.modules.core.BasePackage;
import abi47_0_0.expo.modules.core.ViewManager;

public class GLPackage extends BasePackage {
  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.singletonList((ExportedModule) new GLObjectManagerModule(context));
  }

  @Override
  public List<ViewManager> createViewManagers(Context context) {
    return Collections.singletonList((ViewManager) new GLViewManager());
  }
}
