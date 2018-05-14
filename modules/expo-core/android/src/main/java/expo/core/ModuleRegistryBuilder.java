package expo.core;

import android.content.Context;
import android.util.Log;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Builder for {@link ModuleRegistry}, handles global {@link Module}s ({@link #mGlobalModules})
 * -- modules, which can be initialized and reused throughout reloads
 * (don't require {@link Context}) and {@link Package}s ({@link #mPackages}).
 */
public class ModuleRegistryBuilder {
  private List<Package> mPackages;
  private final Map<Class, Module> mGlobalModules = new HashMap<>();

  public ModuleRegistryBuilder(List<Package> initialPackages) {
    mPackages = initialPackages;
    for (Package pkg : mPackages) {
      addModulesToMap(pkg.createModules(), mGlobalModules);
    }
  }

  public List<Package> getPackages() {
    return mPackages;
  }

  public ModuleRegistry build(Context context) {
    Map<Class, Module> typedModulesMap = new HashMap<>(mGlobalModules);
    for (Package pkg : mPackages) {
      addModulesToMap(pkg.createModules(context), typedModulesMap);
    }
    return new ModuleRegistry(typedModulesMap);
  }

  private void addModulesToMap(List<Module> modules, Map<Class, Module> typedModulesMap) {
    if (modules != null) {
      for (Module module : modules) {
        for (Class exportedInterface : module.getExportedInterfaces()) {
          if (typedModulesMap.containsKey(exportedInterface)) {
            Log.w("E_DUPLICATE_MOD_ALIAS", "Module map already contains a module for key " + exportedInterface + ". Dropping module " + module + ".");
          } else {
            typedModulesMap.put(exportedInterface, module);
          }
        }
      }
    }
  }
}
