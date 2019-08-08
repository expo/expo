package abi32_0_0.expo.adapters.react;

import android.content.Context;

import abi32_0_0.com.facebook.react.bridge.ReactApplicationContext;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.WeakHashMap;

import abi32_0_0.expo.core.ExportedModule;
import abi32_0_0.expo.core.ModuleRegistry;
import abi32_0_0.expo.core.ModuleRegistryProvider;
import abi32_0_0.expo.core.interfaces.InternalModule;
import abi32_0_0.expo.core.ViewManager;
import abi32_0_0.expo.core.interfaces.Package;
import org.unimodules.core.interfaces.SingletonModule;

/**
 * Since React Native v0.55, {@link abi32_0_0.com.facebook.react.ReactPackage#createViewManagers(ReactApplicationContext)}
 * gets called only once per lifetime of {@link abi32_0_0.com.facebook.react.ReactInstanceManager}.
 *
 * To make expo-react-native-adapter compatible with this change we have to remember view managers collection
 * which is returned in {@link ModuleRegistryAdapter#createViewManagers(ReactApplicationContext)}
 * only once (and managers returned this one time will persist "forever").
 */
public class ReactModuleRegistryProvider extends ModuleRegistryProvider {
  private Collection<ViewManager> mViewManagers;
  private Collection<SingletonModule> mSingletonModules;

  public ReactModuleRegistryProvider(List<Package> initialPackages, List<SingletonModule> singletonModules) {
    super(initialPackages);
    mSingletonModules = singletonModules;
  }

  @Override
  public ModuleRegistry get(Context context) {
    Collection<InternalModule> internalModules = new ArrayList<>();
    Collection<ExportedModule> exportedModules = new ArrayList<>();

    for (Package pkg : getPackages()) {
      internalModules.addAll(pkg.createInternalModules(context));
      exportedModules.addAll(pkg.createExportedModules(context));
    }
    return new ModuleRegistry(internalModules, exportedModules, getViewManagers(context), getSingletonModules(context));
  }

  private Collection<SingletonModule> getSingletonModules(Context context) {
    // If singleton modules were provided to registry provider, then just pass them to module registry.
    if (mSingletonModules != null) {
      return mSingletonModules;
    }
    Collection<SingletonModule> singletonModules = new ArrayList<>();

    for (Package pkg : getPackages()) {
      singletonModules.addAll(pkg.createSingletonModules(context));
    }
    return singletonModules;
  }

  /* package */ Collection<ViewManager> getViewManagers(Context context) {
    if (mViewManagers != null) {
      return mViewManagers;
    }

    mViewManagers = Collections.newSetFromMap(new WeakHashMap<ViewManager, Boolean>());
    mViewManagers.addAll(createViewManagers(context));
    return mViewManagers;
  }
}
