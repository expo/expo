package expo.core;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.core.interfaces.InternalModule;
import expo.core.interfaces.Package;
import expo.core.interfaces.SingletonModule;

public class BasePackage implements Package {
  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.emptyList();
  }

  @Override
  public List<ExportedModule> createExportedModules(Context context) {
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager> createViewManagers(Context context) {
    return Collections.emptyList();
  }

  @Override
  public List<SingletonModule> createSingletonModules(Context context) {
    return Collections.emptyList();
  }
}
