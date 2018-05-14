package expo.core;

import android.util.Log;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ModuleRegistry {
  private final Map<Class, Module> mTypedModulesMap;
  private List<ModuleRegistryConsumer> mRegistryConsumers = new ArrayList<>();

  protected ModuleRegistry(Map<Class, Module> typedModulesMap) {
    mTypedModulesMap = typedModulesMap;
  }

  public <T> T getModule(Class<T> interfaceClass) {
    return (T) mTypedModulesMap.get(interfaceClass);
  }

  public void registerModule(Module module) {
    for (Class exportedInterface : module.getExportedInterfaces()) {
      if (mTypedModulesMap.containsKey(exportedInterface)) {
        Log.w("E_DUPLICATE_MOD_ALIAS", "Module map already contains a module for key " + exportedInterface + ". Dropping module " + module + ".");
      } else {
        mTypedModulesMap.put(exportedInterface, module);
      }
    }
  }

  /**
   * Register a {@link ModuleRegistryConsumer} as interested of
   * when {@link ModuleRegistry} will be ready, i.e. will have
   * all the {@link Module} instances registered.
   */
  public void addRegistryConsumer(ModuleRegistryConsumer consumer) {
    mRegistryConsumers.add(consumer);
  }

  /**
   * Call this when all the modules are initialized and registered
   * in this {@link ModuleRegistry}, so its consumers can access
   * all the needed instances.
   */
  public void initialize() {
    for (ModuleRegistryConsumer consumer : mRegistryConsumers) {
      consumer.setModuleRegistry(this);
    }
  }
}
