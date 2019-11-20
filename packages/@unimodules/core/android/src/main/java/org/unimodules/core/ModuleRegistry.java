package org.unimodules.core;

import org.unimodules.core.interfaces.InternalModule;
import org.unimodules.core.interfaces.RegistryLifecycleListener;
import org.unimodules.core.interfaces.SingletonModule;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ModuleRegistry {
  private volatile boolean mIsInitialized = false;
  private final Map<Class, InternalModule> mInternalModulesMap = new HashMap<>();
  private final Map<String, ViewManager> mViewManagersMap = new HashMap<>();
  private final Map<String, ExportedModule> mExportedModulesMap = new HashMap<>();
  private final Map<Class, ExportedModule> mExportedModulesByClassMap = new HashMap<>();
  private final Map<String, SingletonModule> mSingletonModulesMap = new HashMap<>();
  private final List<WeakReference<RegistryLifecycleListener>> mExtraRegistryLifecycleListeners = new ArrayList<>();

  public ModuleRegistry(
      Collection<InternalModule> internalModules,
      Collection<ExportedModule> exportedModules,
      Collection<ViewManager> viewManagers,
      Collection<SingletonModule> singletonModules) {
    for (InternalModule internalModule : internalModules) {
      registerInternalModule(internalModule);
    }

    for (ExportedModule module : exportedModules) {
      registerExportedModule(module);
    }

    for (ViewManager manager : viewManagers) {
      registerViewManager(manager);
    }

    for (SingletonModule singleton : singletonModules) {
      registerSingletonModule(singleton);
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

  public <T> T getSingletonModule(String singletonName, Class<T> singletonClass) {
    return (T) mSingletonModulesMap.get(singletonName);
  }

  /********************************************************
   *
   *  Registering modules
   *
   *******************************************************/

  public void registerInternalModule(InternalModule module) {
    for (Class exportedInterface : module.getExportedInterfaces()) {
      mInternalModulesMap.put(exportedInterface, module);
    }
  }

  public InternalModule unregisterInternalModule(Class exportedInterface) {
    return mInternalModulesMap.remove(exportedInterface);
  }

  public void registerExportedModule(ExportedModule module) {
    String moduleName = module.getName();
    mExportedModulesMap.put(moduleName, module);
    mExportedModulesByClassMap.put(module.getClass(), module);
  }

  public void registerViewManager(ViewManager manager) {
    String managerName = manager.getName();
    mViewManagersMap.put(managerName, manager);
  }

  public void registerSingletonModule(SingletonModule singleton) {
    String singletonName = singleton.getName();
    mSingletonModulesMap.put(singletonName, singleton);
  }

  public void registerExtraListener(RegistryLifecycleListener outerListener) {
    mExtraRegistryLifecycleListeners.add(new WeakReference<>(outerListener));
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
    List<RegistryLifecycleListener> lifecycleListeners = new ArrayList<>();
    lifecycleListeners.addAll(mExportedModulesMap.values());
    lifecycleListeners.addAll(mInternalModulesMap.values());
    lifecycleListeners.addAll(mViewManagersMap.values());

    for (WeakReference<RegistryLifecycleListener> ref : mExtraRegistryLifecycleListeners) {
      if (ref.get() != null) {
        lifecycleListeners.add(ref.get());
      }
    }

    for (RegistryLifecycleListener lifecycleListener : lifecycleListeners) {
      lifecycleListener.onCreate(this);
    }
  }

  public void onDestroy() {
    List<RegistryLifecycleListener> lifecycleListeners = new ArrayList<>();
    lifecycleListeners.addAll(mExportedModulesMap.values());
    lifecycleListeners.addAll(mInternalModulesMap.values());
    lifecycleListeners.addAll(mViewManagersMap.values());

    for (WeakReference<RegistryLifecycleListener> ref : mExtraRegistryLifecycleListeners) {
      if (ref.get() != null) {
        lifecycleListeners.add(ref.get());
      }
    }

    for (RegistryLifecycleListener lifecycleListener : lifecycleListeners) {
      lifecycleListener.onDestroy();
    }
  }
}
