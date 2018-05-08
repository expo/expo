package expo.core;

import android.content.Context;
import android.util.Log;

import java.lang.ref.WeakReference;
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

  private List<WeakReference<ModuleRegistryConsumer>> mRegistryConsumers = new ArrayList<>();

  public ModuleRegistry(
          Collection<Module> internalModules,
          Collection<ExportedModule> exportedModules,
          Collection<ViewManager> viewManagers) {
    for (Module module : internalModules) {
      registerInternalModule(module);
    }

    for (ExportedModule module : exportedModules) {
      registerExportedModule(module);
    }

    for (ViewManager manager : viewManagers) {
      registerViewManager(manager);
    }
  }

  public ModuleRegistry(List<Package> packages, Context context) {
    this(
            createInternalModules(packages, context),
            createExportedModules(packages, context),
            createViewManagers(packages, context)
    );
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
        maybeAddRegistryConsumer(module);
      }
    }
  }

  public void registerExportedModule(ExportedModule module) {
    String moduleName = module.getName();

    if (mExportedModulesMap.containsKey(moduleName)) {
      Log.w("E_DUPLICATE_MOD_ALIAS", "Exported modules map already contains a module for key " + moduleName + ". Dropping module " + module + ".");
    } else {
      mExportedModulesMap.put(moduleName, module);
      maybeAddRegistryConsumer(module);
    }
  }

  public void registerViewManager(ViewManager manager) {
    String managerName = manager.getName();

    if (mViewManagersMap.containsKey(managerName)) {
      Log.w("E_DUPLICATE_MOD_ALIAS", "View managers map already contains a manager for key " + managerName + ". Dropping manager " + manager + ".");
    } else {
      mViewManagersMap.put(managerName, manager);
      maybeAddRegistryConsumer(manager);
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
    mRegistryConsumers.add(new WeakReference<>(consumer));
  }

  private void maybeAddRegistryConsumer(Object maybeConsumer) {
    if (maybeConsumer instanceof ModuleRegistryConsumer) {
      addRegistryConsumer((ModuleRegistryConsumer) maybeConsumer);
    }
  }

  /**
   * Call this when all the modules are initialized and registered
   * in this {@link ModuleRegistry}, so its consumers can access
   * all the needed instances.
   */
  public void initialize() {
    Collection<WeakReference> emptyReferences = new ArrayList<>();
    for (WeakReference<ModuleRegistryConsumer> consumerWeakReference : mRegistryConsumers) {
      ModuleRegistryConsumer consumer = consumerWeakReference.get();
      if (consumer != null) {
        consumer.setModuleRegistry(this);
      } else {
        emptyReferences.add(consumerWeakReference);
      }
    }
    mRegistryConsumers.removeAll(emptyReferences);
  }

  /********************************************************
   *
   *  Initializing helpers
   *
   *******************************************************/

  public static Collection<Module> createInternalModules(Collection<Package> packages, Context context) {
    Collection<Module> internalModules = new ArrayList<>();
    for (Package pkg : packages) {
      internalModules.addAll(pkg.createInternalModules(context));
    }
    return internalModules;
  }

  public static Collection<ExportedModule> createExportedModules(Collection<Package> packages, Context context) {
    Collection<ExportedModule> exportedModules = new ArrayList<>();
    for (Package pkg : packages) {
      exportedModules.addAll(pkg.createExportedModules(context));
    }
    return exportedModules ;
  }

  public static Collection<ViewManager> createViewManagers(Collection<Package> packages, Context context) {
    Collection<ViewManager> viewManagers = new ArrayList<>();
    for (Package pkg : packages) {
      viewManagers.addAll(pkg.createViewManagers(context));
    }
    return viewManagers;
  }
}
