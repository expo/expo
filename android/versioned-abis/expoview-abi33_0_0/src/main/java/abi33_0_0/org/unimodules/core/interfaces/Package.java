package abi33_0_0.org.unimodules.core.interfaces;

import android.content.Context;

import org.unimodules.core.interfaces.SingletonModule;

import java.util.Collections;
import java.util.List;

import abi33_0_0.org.unimodules.core.ExportedModule;
import abi33_0_0.org.unimodules.core.ViewManager;

public interface Package {

  default List<? extends InternalModule> createInternalModules(Context context) {
    return Collections.emptyList();
  }

  default List<? extends ExportedModule> createExportedModules(Context context) {
    return Collections.emptyList();
  }

  /**
   * @param context A context which you can use when initializing view managers,
   *                however remember NOT TO KEEP REFERENCES TO IT. View managers
   *                are reused between refreshes of the application, so keeping
   *                reference to the context in view managers makes it leak.
   */
  default List<? extends ViewManager> createViewManagers(Context context) {
    return Collections.emptyList();
  }

  default List<? extends SingletonModule> createSingletonModules(Context context) {
    return Collections.emptyList();
  }
}
