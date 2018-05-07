package expo.core;

import android.content.Context;
import android.util.Log;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import expo.core.interfaces.Module;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.Package;
import expo.core.interfaces.ViewManager;

public class ModuleRegistry {
  private final Map<Class, Module> mInternalModulesMap = new HashMap<>();
  private final Map<String, ViewManager> mViewManagersMap = new HashMap<>();
  private final Map<String, ExportedModule> mExportedModulesMap = new HashMap<>();

  private List<ModuleRegistryConsumer> mRegistryConsumers = new ArrayList<>();

  protected ModuleRegistry(List<Package> packages, Context context) {
    for (Package pkg : packages) {
      for (Module module : pkg.createInternalModules(context)) {
        registerInternalModule(module);
      }

      for (ExportedModule module : pkg.createExportedModules(context)) {
        registerExportedModule(module);
      }

      for (ViewManager manager : pkg.createViewManagers(context)) {
        registerViewManager(manager);
      }
    }

    addRegistryConsumers(mInternalModulesMap.values());
    addRegistryConsumers(mViewManagersMap.values());
    addRegistryConsumers(mExportedModulesMap.values());
  }

  /********************************************************
   *
   *  Getting registered modules
   *
   *******************************************************/

  @SuppressWarnings("unchecked")
  public <T> T getModule(Class<T> interfaceClass) {
    return (T) mInternalModulesMap.get(interfaceClass);
  }

  public ExportedModule getExportedModule(String name) {
    return mExportedModulesMap.get(name);
  }

  public Collection<ViewManager> getAllViewManagers() {
    return mViewManagersMap.values();
  }

  public Collection<ExportedModule> getAllExportedModules() {
    return mExportedModulesMap.values();
  }

  /********************************************************
   *
   *  Registering modules
   *
   *******************************************************/

  public void registerInternalModule(Module module) {
    for (Class exportedInterface : module.getExportedInterfaces()) {
      if (mInternalModulesMap.containsKey(exportedInterface)) {
        Log.w("E_DUPLICATE_MOD_ALIAS", "Module map already contains a module for key " + exportedInterface + ". Dropping module " + module + ".");
      } else {
        mInternalModulesMap.put(exportedInterface, module);
      }
    }
  }

  public void registerExportedModule(ExportedModule module) {
    String moduleName = module.getName();

    if (mExportedModulesMap.containsKey(moduleName)) {
      Log.w("E_DUPLICATE_MOD_ALIAS", "Exported modules map already contains a module for key " + moduleName + ". Dropping module " + module + ".");
    } else {
      mExportedModulesMap.put(moduleName, module);
    }
  }

  public void registerViewManager(ViewManager manager) {
    String managerName = manager.getName();

    if (mViewManagersMap.containsKey(managerName)) {
      Log.w("E_DUPLICATE_MOD_ALIAS", "View managers map already contains a manager for key " + managerName + ". Dropping manager " + manager + ".");
    } else {
      mViewManagersMap.put(managerName, manager);
    }
  }

  /********************************************************
   *
   *  Managing registry consumers
   *
   *******************************************************/

  /**
   * Register a {@link ModuleRegistryConsumer} as interested of
   * when {@link ModuleRegistry} will be ready, i.e. will have
   * all the {@link Module} instances registered.
   */
  public void addRegistryConsumer(ModuleRegistryConsumer consumer) {
    mRegistryConsumers.add(consumer);
  }

  public void addRegistryConsumers(Collection objects) {
    for (Object maybeConsumer : objects) {
      if (maybeConsumer instanceof ModuleRegistryConsumer) {
        addRegistryConsumer((ModuleRegistryConsumer) maybeConsumer);
      }
    }
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
