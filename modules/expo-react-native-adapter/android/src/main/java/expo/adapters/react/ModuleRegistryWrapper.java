package expo.adapters.react;

import android.content.Context;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.List;
import java.util.WeakHashMap;

import expo.core.ExportedModule;
import expo.core.Module;
import expo.core.ModuleRegistry;
import expo.core.ModuleRegistryBuilder;
import expo.core.ModuleRegistryConsumer;
import expo.core.Package;

/**
 * A proxy over {@link ModuleRegistry}, compatible with React (implementing {@link ReactPackage}).
 * Provides React Native with native modules and view managers,
 * which in turn are created by packages provided by {@link ModuleRegistryBuilder}.
 */
public class ModuleRegistryWrapper implements ReactPackage {
  private ModuleRegistryBuilder mModuleRegistryBuilder;
  private WeakHashMap<Context, ModuleRegistry> mRegistryForContext = new WeakHashMap<>();

  public ModuleRegistryWrapper(ModuleRegistryBuilder moduleRegistryBuilder) {
    mModuleRegistryBuilder = moduleRegistryBuilder;
  }

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    ModuleRegistry moduleRegistry = getOrCreateModuleRegistryForContext(reactContext);
    List<NativeModule> nativeModulesList = new ArrayList<>();
    List<ExportedModule> allExpoExportedModules = new ArrayList<>();
    for (Package pkg : mModuleRegistryBuilder.getPackages()) {
      allExpoExportedModules.addAll(pkg.createExportedModules(reactContext));
    }

    ExportedModule[] exportedModulesArray = allExpoExportedModules.toArray(new ExportedModule[allExpoExportedModules.size()]);
    nativeModulesList.add(new NativeModulesProxy(reactContext, exportedModulesArray));

    registerModulesInRegistry(allExpoExportedModules, moduleRegistry);

    // Add listener that will notify expo.core.ModuleRegistry when all modules are ready
    nativeModulesList.add(new ModuleRegistryReadyNotifier(moduleRegistry));

    return nativeModulesList;
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    ModuleRegistry moduleRegistry = getOrCreateModuleRegistryForContext(reactContext);
    List<ViewManager> viewManagerList = new ArrayList<>();
    for (Package pkg : mModuleRegistryBuilder.getPackages()) {
      if (pkg instanceof expo.adapters.react.ReactPackage) {
        expo.adapters.react.ReactPackage reactPackage = (expo.adapters.react.ReactPackage) pkg;
        viewManagerList.addAll(reactPackage.createViewManagers(reactContext));
      }

      for(expo.core.ViewManager viewManager : pkg.createViewManagers(reactContext)) {
        viewManagerList.add(new ViewManagerAdapter(viewManager));
      }
    }
    registerModulesInRegistry(viewManagerList, moduleRegistry);
    return viewManagerList;
  }

  /**
   * Get {@link ModuleRegistry} from {@link #mRegistryForContext}
   * if we already have an instance for this Context, create new one otherwise.
   */
  private ModuleRegistry getOrCreateModuleRegistryForContext(Context context) {
    ModuleRegistry moduleRegistry = mRegistryForContext.get(context);
    if (moduleRegistry == null) {
      moduleRegistry = mModuleRegistryBuilder.build(context);
      mRegistryForContext.put(context, moduleRegistry);
    }
    return moduleRegistry;
  }

  private void registerModulesInRegistry(List maybeModules, ModuleRegistry moduleRegistry) {
    for (Object nativeModule : maybeModules) {
      if (nativeModule instanceof ModuleRegistryConsumer) {
        moduleRegistry.addRegistryConsumer((ModuleRegistryConsumer) nativeModule);
      }

      if (nativeModule instanceof Module) {
        moduleRegistry.registerModule((Module) nativeModule);
      }
    }
  }
}
