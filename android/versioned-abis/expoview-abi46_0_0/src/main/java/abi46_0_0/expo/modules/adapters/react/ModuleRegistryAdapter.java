package abi46_0_0.expo.modules.adapters.react;

import abi46_0_0.com.facebook.react.ReactPackage;
import abi46_0_0.com.facebook.react.bridge.NativeModule;
import abi46_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi46_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import abi46_0_0.expo.modules.adapters.react.views.SimpleViewManagerAdapter;
import abi46_0_0.expo.modules.adapters.react.views.ViewGroupManagerAdapter;
import abi46_0_0.expo.modules.core.ModuleRegistry;
import abi46_0_0.expo.modules.core.interfaces.InternalModule;
import abi46_0_0.expo.modules.core.interfaces.Package;
import abi46_0_0.expo.modules.kotlin.KotlinInteropModuleRegistry;
import abi46_0_0.expo.modules.kotlin.ModulesProvider;
import abi46_0_0.expo.modules.kotlin.views.ViewWrapperDelegateHolder;

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
  // We need to save all view holders to update them when the new kotlin module registry will be created.
  private List<ViewWrapperDelegateHolder> mWrapperDelegateHolders = null;

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
    ModuleRegistry moduleRegistry = mModuleRegistryProvider.get(reactContext);

    for (InternalModule internalModule : mReactAdapterPackage.createInternalModules(reactContext)) {
      moduleRegistry.registerInternalModule(internalModule);
    }

    List<NativeModule> nativeModules = getNativeModulesFromModuleRegistry(reactContext, moduleRegistry);
    if (mWrapperDelegateHolders != null) {
      KotlinInteropModuleRegistry kotlinInteropModuleRegistry = mModulesProxy.getKotlinInteropModuleRegistry();
      kotlinInteropModuleRegistry.updateModuleHoldersInViewManagers(mWrapperDelegateHolders);
    }

    return nativeModules;
  }

  protected List<NativeModule> getNativeModulesFromModuleRegistry(ReactApplicationContext reactContext, ModuleRegistry moduleRegistry) {
    List<NativeModule> nativeModulesList = new ArrayList<>(2);

    mModulesProxy = createNativeModulesProxy(reactContext, moduleRegistry);
    nativeModulesList.add(mModulesProxy);

    // Add listener that will notify abi46_0_0.expo.modules.core.ModuleRegistry when all modules are ready
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

    for (abi46_0_0.expo.modules.core.ViewManager viewManager : mModuleRegistryProvider.getViewManagers(reactContext)) {
      switch (viewManager.getViewManagerType()) {
        case GROUP:
          viewManagerList.add(new ViewGroupManagerAdapter(viewManager));
          break;
        case SIMPLE:
          viewManagerList.add(new SimpleViewManagerAdapter(viewManager));
          break;
      }
    }

    // We assume that `createNativeModules` was called first.
    NativeModulesProxy modulesProxy = Objects.requireNonNull(mModulesProxy);
    KotlinInteropModuleRegistry kotlinInteropModuleRegistry = modulesProxy.getKotlinInteropModuleRegistry();
    List<ViewManager<?, ?>> kViewManager = kotlinInteropModuleRegistry.exportViewManagers();
    // Saves all holders that needs to be in sync with module registry
    mWrapperDelegateHolders = kotlinInteropModuleRegistry.extractViewManagersDelegateHolders(kViewManager);
    viewManagerList.addAll(kViewManager);

    return viewManagerList;
  }

  private NativeModulesProxy createNativeModulesProxy(ReactApplicationContext reactContext, ModuleRegistry moduleRegistry) {
    if (mModulesProvider != null) {
      return new NativeModulesProxy(reactContext, moduleRegistry, mModulesProvider);
    } else {
      return new NativeModulesProxy(reactContext, moduleRegistry);
    }
  }
}
