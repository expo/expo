package org.unimodules.core.interfaces;

import android.content.Context;

import java.util.List;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ViewManager;

public interface Package {
  List<InternalModule> createInternalModules(Context context);
  List<ExportedModule> createExportedModules(Context context);

  /**
   * @param context A context which you can use when initializing view managers,
   *                however remember NOT TO KEEP REFERENCES TO IT. View managers
   *                are reused between refreshes of the application, so keeping
   *                reference to the context in view managers makes it leak.
   */
  List<ViewManager> createViewManagers(Context context);

  List<SingletonModule> createSingletonModules(Context context);
}
