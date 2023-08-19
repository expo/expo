package expo.modules.adapters.react;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import androidx.annotation.Nullable;

import expo.modules.BuildConfig;
import expo.modules.core.ModuleRegistry;
import expo.modules.core.interfaces.Consumer;
import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.Package;
import expo.modules.kotlin.AppContext;
import expo.modules.kotlin.CoreLoggerKt;
import expo.modules.kotlin.KotlinInteropModuleRegistry;
import expo.modules.kotlin.ModulesProvider;
import expo.modules.kotlin.views.ViewWrapperDelegateHolder;

/**
 * An adapter over {@link ModuleRegistry}, compatible with React (implementing {@link ReactPackage}).
 * Provides React Native with native modules and view managers,
 * which in turn are created by packages provided by {@link ReactModuleRegistryProvider}.
 */
public class ModuleRegistryAdapter implements ReactPackage {
  protected ReactModuleRegistryProvider mModuleRegistryProvider;
  protected ModulesProvider mModulesProvider;
  protected ReactAdapterPackage mReactAdapterPackage = new ReactAdapterPackage();
  private NativeModulesProxy mModulesProxy;

  private void setModulesProxy(@Nullable NativeModulesProxy newProxy) {
    mModulesProxy = newProxy;
    if (mModulesProxy != null) {
      mModulesProxy.getKotlinInteropModuleRegistry().setLegacyModulesProxy(mModulesProxy);
    }
  }

  // We need to save all view holders to update them when the new kotlin module registry will be created.
  private List<ViewWrapperDelegateHolder> mWrapperDelegateHolders = null;
  private FabricComponentsRegistry mFabricComponentsRegistry = null;

  public ModuleRegistryAdapter(List<Package> packageList) {
    mModuleRegistryProvider = new ReactModuleRegistryProvider(packageList, null);
  }

  public ModuleRegistryAdapter(ReactModuleRegistryProvider moduleRegistryProvider) {
    mModuleRegistryProvider = moduleRegistryProvider;
  }

  public ModuleRegistryAdapter(ReactModuleRegistryProvider moduleRegistryProvider, ModulesProvider modulesProvider) {
    mModuleRegistryProvider = moduleRegistryProvider;
    mModulesProvider = modulesProvider;
  }

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    NativeModulesProxy proxy = getOrCreateNativeModulesProxy(reactContext, null);
    ModuleRegistry moduleRegistry = proxy.getModuleRegistry();

    for (InternalModule internalModule : mReactAdapterPackage.createInternalModules(reactContext)) {
      moduleRegistry.registerInternalModule(internalModule);
    }

    List<NativeModule> nativeModules = getNativeModulesFromModuleRegistry(reactContext, moduleRegistry, null);
    if (mWrapperDelegateHolders != null) {
      KotlinInteropModuleRegistry kotlinInteropModuleRegistry = proxy.getKotlinInteropModuleRegistry();
      kotlinInteropModuleRegistry.updateModuleHoldersInViewManagers(mWrapperDelegateHolders);
    }

    return nativeModules;
  }

  protected List<NativeModule> getNativeModulesFromModuleRegistry(
    ReactApplicationContext reactContext,
    ModuleRegistry moduleRegistry,
    @Nullable Consumer<AppContext> appContextConsumer
  ) {
    List<NativeModule> nativeModulesList = new ArrayList<>(2);
    NativeModulesProxy nativeModulesProxy = getOrCreateNativeModulesProxy(reactContext, moduleRegistry);
    if (appContextConsumer != null) {
      appContextConsumer.apply(nativeModulesProxy.getKotlinInteropModuleRegistry().getAppContext());
    }
    nativeModulesList.add(nativeModulesProxy);

    // Add listener that will notify expo.modules.core.ModuleRegistry when all modules are ready
    nativeModulesList.add(new ModuleRegistryReadyNotifier(moduleRegistry));

    ReactPackagesProvider reactPackagesProvider = moduleRegistry.getModule(ReactPackagesProvider.class);
    for (ReactPackage reactPackage : reactPackagesProvider.getReactPackages()) {
      nativeModulesList.addAll(reactPackage.createNativeModules(reactContext));
    }

    return nativeModulesList;
  }

  @Override
  @SuppressWarnings("unchecked")
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    List<ViewManager> viewManagerList = new ArrayList<>(mModuleRegistryProvider.getReactViewManagers(reactContext));

    NativeModulesProxy modulesProxy = Objects.requireNonNull(getOrCreateNativeModulesProxy(reactContext, null));
    KotlinInteropModuleRegistry kotlinInteropModuleRegistry = modulesProxy.getKotlinInteropModuleRegistry();
    List<ViewManager<?, ?>> kViewManager = kotlinInteropModuleRegistry.exportViewManagers();
    // Saves all holders that needs to be in sync with module registry
    mWrapperDelegateHolders = kotlinInteropModuleRegistry.extractViewManagersDelegateHolders(kViewManager);
    viewManagerList.addAll(kViewManager);
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // Intentionally to only add Sweet API view managers for Fabric support
      mFabricComponentsRegistry = new FabricComponentsRegistry(kViewManager);
    }

    return viewManagerList;
  }

  private synchronized NativeModulesProxy getOrCreateNativeModulesProxy(
    ReactApplicationContext reactContext,
    @Nullable ModuleRegistry moduleRegistry
  ) {
    if (mModulesProxy != null && mModulesProxy.getReactContext() != reactContext) {
      setModulesProxy(null);
    }
    if (mModulesProxy == null) {
      ModuleRegistry registry = moduleRegistry != null ? moduleRegistry : mModuleRegistryProvider.get(reactContext);
      if (mModulesProvider != null) {
        setModulesProxy(new NativeModulesProxy(reactContext, registry, mModulesProvider));
      } else {
        setModulesProxy(new NativeModulesProxy(reactContext, registry));
      }
    }

    if (moduleRegistry != null && moduleRegistry != mModulesProxy.getModuleRegistry()) {
      CoreLoggerKt.getLogger().error("❌ NativeModuleProxy was configured with a different instance of the modules registry.", null);
    }

    return mModulesProxy;
  }
}
