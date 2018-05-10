package expo.adapters.react;

import android.content.Context;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.WeakHashMap;

import expo.core.ModuleRegistry;
import expo.core.ModuleRegistryBuilder;

/**
 * An adapter over {@link ModuleRegistry}, compatible with React (implementing {@link ReactPackage}).
 * Provides React Native with native modules and view managers,
 * which in turn are created by packages provided by {@link ModuleRegistryBuilder}.
 */
public class ModuleRegistryAdapter implements ReactPackage {
  private ModuleRegistryBuilder mModuleRegistryBuilder;
  private Map<Context, WeakReference<ModuleRegistry>> mRegistryForContext = new WeakHashMap<>();

  public ModuleRegistryAdapter(ModuleRegistryBuilder moduleRegistryBuilder) {
    mModuleRegistryBuilder = moduleRegistryBuilder;
  }

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    ModuleRegistry moduleRegistry = getOrCreateModuleRegistryForContext(reactContext);

    List<NativeModule> nativeModulesList = new ArrayList<>(2);

    nativeModulesList.add(new NativeModulesProxy(reactContext, moduleRegistry));

    // Add listener that will notify expo.core.ModuleRegistry when all modules are ready
    nativeModulesList.add(new ModuleRegistryReadyNotifier(moduleRegistry));

    return nativeModulesList;
  }

  @Override
  @SuppressWarnings("unchecked")
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    ModuleRegistry moduleRegistry = getOrCreateModuleRegistryForContext(reactContext);
    List<ViewManager> viewManagerList = new ArrayList<>();

    for (expo.core.interfaces.ViewManager viewManager : moduleRegistry.getAllViewManagers()) {
      viewManagerList.add(new ViewManagerAdapter(viewManager));
    }
    return viewManagerList;
  }

  /**
   * Get {@link ModuleRegistry} from {@link #mRegistryForContext}
   * if we already have an instance for this Context, create new one otherwise.
   */
  private ModuleRegistry getOrCreateModuleRegistryForContext(final Context context) {
    WeakReference<ModuleRegistry> moduleRegistryReference = mRegistryForContext.get(context);
    if (moduleRegistryReference == null || moduleRegistryReference.get() == null) {
      moduleRegistryReference = new WeakReference<>(mModuleRegistryBuilder.build(context));
      mRegistryForContext.put(context, moduleRegistryReference);
    }
    return moduleRegistryReference.get();
  }
}
