package abi49_0_0.expo.modules.adapters.react;

import abi49_0_0.com.facebook.react.ReactPackage;
import abi49_0_0.com.facebook.react.bridge.NativeModule;
import abi49_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi49_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import androidx.annotation.Nullable;

import host.exp.expoview.BuildConfig;
import abi49_0_0.expo.modules.adapters.react.views.SimpleViewManagerAdapter;
import abi49_0_0.expo.modules.adapters.react.views.ViewGroupManagerAdapter;
import abi49_0_0.expo.modules.core.ModuleRegistry;
import abi49_0_0.expo.modules.core.interfaces.Consumer;
import abi49_0_0.expo.modules.core.interfaces.InternalModule;
import abi49_0_0.expo.modules.core.interfaces.Package;
import abi49_0_0.expo.modules.kotlin.AppContext;
import abi49_0_0.expo.modules.kotlin.CoreLoggerKt;
import abi49_0_0.expo.modules.kotlin.KotlinInteropModuleRegistry;
import abi49_0_0.expo.modules.kotlin.ModulesProvider;
import abi49_0_0.expo.modules.kotlin.views.ViewWrapperDelegateHolder;

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

    // Add listener that will notify abi49_0_0.expo.modules.core.ModuleRegistry when all modules are ready
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

    for (abi49_0_0.expo.modules.core.ViewManager viewManager : mModuleRegistryProvider.getViewManagers(reactContext)) {
      switch (viewManager.getViewManagerType()) {
        case GROUP:
          viewManagerList.add(new ViewGroupManagerAdapter(viewManager));
          break;
        case SIMPLE:
          viewManagerList.add(new SimpleViewManagerAdapter(viewManager));
          break;
      }
    }

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
      setModulesProxy(mModulesProxy);
    }
    if (mModulesProxy == null) {
      ModuleRegistry registry = moduleRegistry != null ? moduleRegistry : mModuleRegistryProvider.get(reactContext);
      if (mModulesProvider != null) {
        setModulesProxy(new NativeModulesProxy(reactContext, registry, mModulesProvider));
      } else {
        setModulesProxy(new NativeModulesProxy(reactContext, registry));
      }

      mModulesProxy.getKotlinInteropModuleRegistry().setLegacyModulesProxy(mModulesProxy);
    }

    if (moduleRegistry != null && moduleRegistry != mModulesProxy.getModuleRegistry()) {
      CoreLoggerKt.getLogger().error("❌ NativeModuleProxy was configured with a different instance of the modules registry.", null);
    }

    return mModulesProxy;
  }
}
