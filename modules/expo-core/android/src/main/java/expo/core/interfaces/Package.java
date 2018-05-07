package expo.core.interfaces;

import android.content.Context;

import java.util.List;

import expo.core.ExportedModule;

public interface Package {
  List<Module> createInternalModules(Context context);
  List<ExportedModule> createExportedModules(Context context);
  List<ViewManager> createViewManagers(Context context);
}
