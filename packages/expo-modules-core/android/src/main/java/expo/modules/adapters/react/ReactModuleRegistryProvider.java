package expo.modules.adapters.react;

import android.content.Context;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.ReactApplicationContext;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;

import expo.modules.core.ModuleRegistry;
import expo.modules.core.ModuleRegistryProvider;
import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.Package;
import expo.modules.core.interfaces.SingletonModule;

/**
 * Since React Native v0.55, {@link com.facebook.react.ReactPackage#createViewManagers(ReactApplicationContext)}
 * gets called only once per lifetime of {@link com.facebook.react.ReactInstanceManager}.
 * <p>
 * To make @unimodules/react-native-adapter compatible with this change we have to remember view managers collection
 * which is returned in {@link ModuleRegistryAdapter#createViewManagers(ReactApplicationContext)}
 * only once (and managers returned this one time will persist "forever").
 */
public class ReactModuleRegistryProvider extends ModuleRegistryProvider {
  private Collection<com.facebook.react.uimanager.ViewManager> mReactViewManagers;
  private Collection<SingletonModule> mSingletonModules;

  public ReactModuleRegistryProvider(List<Package> initialPackages) {
    this(initialPackages, null);
  }

  public ReactModuleRegistryProvider(List<Package> initialPackages, List<SingletonModule> singletonModules) {
    super(initialPackages);
    mSingletonModules = singletonModules;
  }

  @Override
  public ModuleRegistry get(Context context) {
    Collection<InternalModule> internalModules = new ArrayList<>();

    ReactPackagesProvider reactPackagesProvider = new ReactPackagesProvider();

    for (Package pkg : getPackages()) {
      internalModules.addAll(pkg.createInternalModules(context));

      if (pkg instanceof ReactPackage) {
        reactPackagesProvider.addPackage((ReactPackage) pkg);
      }
    }
    internalModules.add(reactPackagesProvider);

    return new ModuleRegistry(internalModules, getSingletonModules(context));
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

  // TODO: change access to package private when react-native-adapter was removed.
  public Collection<com.facebook.react.uimanager.ViewManager> getReactViewManagers(ReactApplicationContext context) {
    if (mReactViewManagers != null) {
      return mReactViewManagers;
    }

    mReactViewManagers = new HashSet<>();
    for (Package pkg : getPackages()) {
      if (pkg instanceof ReactPackage) {
        mReactViewManagers.addAll(((ReactPackage) pkg).createViewManagers(context));
      }
    }
    return mReactViewManagers;
  }
}
