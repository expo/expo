package expo.modules.gl;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.BasePackage;
import org.unimodules.core.ViewManager;

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
