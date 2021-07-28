package expo.modules.gl;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.modules.core.ExportedModule;
import expo.modules.core.BasePackage;
import expo.modules.core.ViewManager;

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
