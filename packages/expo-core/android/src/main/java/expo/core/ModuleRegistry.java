package expo.core;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import expo.core.interfaces.InternalModule;
import expo.core.interfaces.ModuleRegistryConsumer;

public class ModuleRegistry {
  private volatile boolean mIsInitialized = false;
  private final Map<Class, InternalModule> mInternalModulesMap = new HashMap<>();
  private final Map<String, ViewManager> mViewManagersMap = new HashMap<>();
  private final Map<String, ExportedModule> mExportedModulesMap = new HashMap<>();
  private final Map<Class, ExportedModule> mExportedModulesByClassMap = new HashMap<>();

  private List<WeakReference<ModuleRegistryConsumer>> mRegistryConsumers = new ArrayList<>();

  public ModuleRegistry(
          Collection<InternalModule> internalModules,
          Collection<ExportedModule> exportedModules,
          Collection<ViewManager> viewManagers) {
    for (InternalModule internalModule : internalModules) {
      registerInternalModule(internalModule);
    }

    for (ExportedModule module : exportedModules) {
      registerExportedModule(module);
    }

    for (ViewManager manager : viewManagers) {
      registerViewManager(manager);
    }
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

  public ExportedModule getExportedModuleOfClass(Class moduleClass) {
    return mExportedModulesByClassMap.get(moduleClass);
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

  public void registerInternalModule(InternalModule module) {
    for (Class exportedInterface : module.getExportedInterfaces()) {
      mInternalModulesMap.put(exportedInterface, module);
      maybeAddRegistryConsumer(module);
    }
  }

  public InternalModule unregisterInternalModule(Class exportedInterface) {
    return mInternalModulesMap.remove(exportedInterface);
  }

  public void registerExportedModule(ExportedModule module) {
    String moduleName = module.getName();

    mExportedModulesMap.put(moduleName, module);
    mExportedModulesByClassMap.put(module.getClass(), module);
    maybeAddRegistryConsumer(module);
  }

  public void registerViewManager(ViewManager manager) {
    String managerName = manager.getName();

    mViewManagersMap.put(managerName, manager);
    maybeAddRegistryConsumer(manager);
  }

  /********************************************************
   *
   *  Managing registry consumers
   *
   *******************************************************/

  /**
   * Register a {@link ModuleRegistryConsumer} as interested of
   * when {@link ModuleRegistry} will be ready, i.e. will have
   * all the {@link InternalModule} instances registered.
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
  public synchronized void ensureIsInitialized() {
    if (!mIsInitialized) {
      initialize();
      mIsInitialized = true;
    }
  }

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
}
