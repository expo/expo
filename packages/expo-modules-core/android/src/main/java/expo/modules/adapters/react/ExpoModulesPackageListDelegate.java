package expo.modules.adapters.react;

import android.util.Log;

import expo.modules.core.interfaces.Package;

import java.lang.reflect.Method;
import java.util.Collections;
import java.util.List;

public class ExpoModulesPackageListDelegate {
  @SuppressWarnings("unchecked")
  static public List<Package> getPackageList() {
    try {
      Class<?> expoModules = Class.forName("expo.modules.linker.ExpoModulesPackageList");
      Method getPackageList = expoModules.getMethod("getPackageList");
      return (List<Package>) getPackageList.invoke(null);
    } catch (Exception e) {
      Log.w("ModuleRegistryAdapter", "Couldn't get expo modules list.", e);
      return Collections.emptyList();
    }
  }
}
