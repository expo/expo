package expo.core;

import android.content.Context;

import java.util.Collections;
import java.util.List;

public class BasePackage implements Package {
  public List<Module> createModules() {
    return Collections.emptyList();
  }

  @Override
  public List<Module> createModules(Context context) {
    return Collections.emptyList();
  }

  public List<ExportedModule> createExportedModules(Context reactContext) {
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager> createViewManagers(Context context) {
    return Collections.emptyList();
  }
}
