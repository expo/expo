package org.unimodules.adapters.react;

import android.content.Context;

import com.facebook.react.bridge.ReactApplicationContext;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.WeakHashMap;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.ModuleRegistryProvider;
import org.unimodules.core.interfaces.InternalModule;
import org.unimodules.core.ViewManager;
import org.unimodules.core.interfaces.Package;
import org.unimodules.core.interfaces.SingletonModule;

/**
 * Since React Native v0.55, {@link com.facebook.react.ReactPackage#createViewManagers(ReactApplicationContext)}
 * gets called only once per lifetime of {@link com.facebook.react.ReactInstanceManager}.
 *
 * To make @unimodules/react-native-adapter compatible with this change we have to remember view managers collection
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
