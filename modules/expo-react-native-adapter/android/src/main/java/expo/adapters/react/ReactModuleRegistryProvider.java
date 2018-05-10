package expo.adapters.react;

import android.content.Context;

import com.facebook.react.bridge.ReactApplicationContext;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.WeakHashMap;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.ModuleRegistryProvider;
import expo.core.interfaces.InternalModule;
import expo.core.ViewManager;
import expo.core.interfaces.Package;

/**
 * Since React Native v0.55, {@link com.facebook.react.ReactPackage#createViewManagers(ReactApplicationContext)}
 * gets called only once per lifetime of {@link com.facebook.react.ReactInstanceManager}.
 *
 * To make expo-react-native-adapter compatible with this change we have to remember view managers collection
 * which is returned in {@link ModuleRegistryAdapter#createViewManagers(ReactApplicationContext)}
 * only once (and managers returned this one time will persist "forever").
 */
public class ReactModuleRegistryProvider extends ModuleRegistryProvider {
  private Collection<ViewManager> mViewManagers;

  public ReactModuleRegistryProvider(List<Package> initialPackages) {
    super(initialPackages);
  }

  @Override
  public ModuleRegistry get(Context context) {
    Collection<InternalModule> internalModules = new ArrayList<>();
    Collection<ExportedModule> exportedModules = new ArrayList<>();
    for(Package pkg : getPackages()) {
      internalModules.addAll(pkg.createInternalModules(context));
      exportedModules.addAll(pkg.createExportedModules(context));
    }
    return new ModuleRegistry(internalModules, exportedModules, getViewManagers(context));
  }

  private Collection<ViewManager> getViewManagers(Context context) {
    if (mViewManagers != null) {
      return mViewManagers;
    }

    mViewManagers = Collections.newSetFromMap(new WeakHashMap<ViewManager, Boolean>());
    mViewManagers.addAll(createViewManagers(context));
    return mViewManagers;
  }
}
