package expo.core.interfaces;

import android.content.Context;

import java.util.List;

import expo.core.ExportedModule;

public interface Package {
  List<Module> createInternalModules(Context context);
  List<ExportedModule> createExportedModules(Context context);

  /**
   * @param context A context which you can use when initializing view managers,
   *                however remember NOT TO KEEP REFERENCES TO IT. View managers
   *                are reused between refreshes of the application, so keeping
   *                reference to the context in view managers makes it leak.
   */
  List<ViewManager> createViewManagers(Context context);
}
