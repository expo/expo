package expo.modules.core;

import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.RegistryLifecycleListener;
import expo.modules.core.interfaces.SingletonModule;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ModuleRegistry {
  private final Map<Class, InternalModule> mInternalModulesMap = new HashMap<>();
  private final Map<String, SingletonModule> mSingletonModulesMap = new HashMap<>();
  private final List<WeakReference<RegistryLifecycleListener>> mExtraRegistryLifecycleListeners = new ArrayList<>();
  private volatile boolean mIsInitialized = false;

  public ModuleRegistry(
    Collection<InternalModule> internalModules,
    Collection<SingletonModule> singletonModules) {
    for (InternalModule internalModule : internalModules) {
      registerInternalModule(internalModule);
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
    List<RegistryLifecycleListener> lifecycleListeners = new ArrayList<>(mInternalModulesMap.values());

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
    List<RegistryLifecycleListener> lifecycleListeners = new ArrayList<>(mInternalModulesMap.values());

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
