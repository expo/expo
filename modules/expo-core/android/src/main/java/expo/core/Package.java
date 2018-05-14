package expo.core;

import android.content.Context;

import java.util.List;

public interface Package {
  List<Module> createModules();
  List<Module> createModules(Context context);
  List<ExportedModule> createExportedModules(Context context);
  List<ViewManager> createViewManagers(Context context);
}
