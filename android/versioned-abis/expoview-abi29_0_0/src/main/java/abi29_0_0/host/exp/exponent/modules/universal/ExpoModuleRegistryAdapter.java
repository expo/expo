package abi29_0_0.host.exp.exponent.modules.universal;

import abi29_0_0.com.facebook.react.bridge.NativeModule;
import abi29_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi29_0_0.com.facebook.react.uimanager.ViewManager;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import abi29_0_0.expo.adapters.react.ModuleRegistryAdapter;
import abi29_0_0.expo.adapters.react.ModuleRegistryReadyNotifier;
import abi29_0_0.expo.adapters.react.NativeModulesProxy;
import abi29_0_0.expo.adapters.react.ReactAdapterPackage;
import abi29_0_0.expo.adapters.react.views.SimpleViewManagerAdapter;
import abi29_0_0.expo.adapters.react.views.ViewGroupManagerAdapter;
import abi29_0_0.expo.core.ModuleRegistry;
import abi29_0_0.expo.core.ModuleRegistryProvider;
import abi29_0_0.expo.core.interfaces.InternalModule;
import abi29_0_0.expo.core.interfaces.ModuleRegistryConsumer;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.utils.ScopedContext;
import abi29_0_0.host.exp.exponent.modules.universal.sensors.ScopedAccelerometerService;
import abi29_0_0.host.exp.exponent.modules.universal.sensors.ScopedGravitySensorService;
import abi29_0_0.host.exp.exponent.modules.universal.sensors.ScopedGyroscopeService;
import abi29_0_0.host.exp.exponent.modules.universal.sensors.ScopedLinearAccelerationSensorService;
import abi29_0_0.host.exp.exponent.modules.universal.sensors.ScopedMagnetometerService;
import abi29_0_0.host.exp.exponent.modules.universal.sensors.ScopedMagnetometerUncalibratedService;
import abi29_0_0.host.exp.exponent.modules.universal.sensors.ScopedRotationVectorSensorService;

public class ExpoModuleRegistryAdapter extends ModuleRegistryAdapter implements ScopedModuleRegistryAdapter {
  private ReactAdapterPackage mReactAdapterPackage = new ReactAdapterPackage();

  public ExpoModuleRegistryAdapter(ModuleRegistryProvider moduleRegistryProvider) {
    super(moduleRegistryProvider);
  }

  public List<NativeModule> createNativeModules(ScopedContext scopedContext, ExperienceId experienceId, Map<String, Object> experienceProperties, JSONObject manifest, List<NativeModule> otherModules) {
    ModuleRegistry moduleRegistry = mModuleRegistryProvider.get(scopedContext);

    // Overriding sensor services from expo-sensors for scoped implementations using kernel services
    moduleRegistry.registerInternalModule(new ScopedAccelerometerService(experienceId));
    moduleRegistry.registerInternalModule(new ScopedGravitySensorService(experienceId));
    moduleRegistry.registerInternalModule(new ScopedGyroscopeService(experienceId));
    moduleRegistry.registerInternalModule(new ScopedLinearAccelerationSensorService(experienceId));
    moduleRegistry.registerInternalModule(new ScopedMagnetometerService(experienceId));
    moduleRegistry.registerInternalModule(new ScopedMagnetometerUncalibratedService(experienceId));
    moduleRegistry.registerInternalModule(new ScopedRotationVectorSensorService(experienceId));

    // Overriding expo-permissions/PermissionsService -- binding checks with kernel services
    moduleRegistry.registerInternalModule(new PermissionsBinding(scopedContext, experienceId));

    // Overriding expo-constants/ConstantsService -- binding provides manifest and other expo-related constants
    moduleRegistry.registerInternalModule(new ConstantsBinding(scopedContext, experienceProperties, manifest));

    // ReactAdapterPackage requires ReactContext
    ReactApplicationContext reactContext = (ReactApplicationContext) scopedContext.getContext();
    for (InternalModule internalModule : mReactAdapterPackage.createInternalModules(reactContext)) {
      moduleRegistry.registerInternalModule(internalModule);
    }

    // Overriding ScopedUIManagerModuleWrapper from ReactAdapterPackage
    moduleRegistry.registerInternalModule(new ScopedUIManagerModuleWrapper(reactContext, experienceId, manifest.optString(ExponentManifest.MANIFEST_NAME_KEY)));

    // Adding other modules (not universal) to module registry as consumers.
    // It allows these modules to refer to universal modules.
    for (NativeModule otherModule : otherModules) {
      if (otherModule instanceof ModuleRegistryConsumer) {
        moduleRegistry.addRegistryConsumer((ModuleRegistryConsumer) otherModule);
      }
    }

    return getNativeModulesFromModuleRegistry(reactContext, moduleRegistry);
  }

  protected List<NativeModule> getNativeModulesFromModuleRegistry(ReactApplicationContext reactApplicationContext, ModuleRegistry moduleRegistry) {
    List<NativeModule> nativeModulesList = new ArrayList<>(2);

    nativeModulesList.add(new NativeModulesProxy(reactApplicationContext, moduleRegistry));

    // Add listener that will notify expo.core.ModuleRegistry when all modules are ready
    nativeModulesList.add(new ModuleRegistryReadyNotifier(moduleRegistry));

    return nativeModulesList;
  }

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    throw new RuntimeException("Use createNativeModules(ReactApplicationContext, ExperienceId, JSONObject, List<NativeModule>) to get a list of native modules.");
  }

  @Override
  @SuppressWarnings("unchecked")
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    ModuleRegistry moduleRegistry = mModuleRegistryProvider.get(reactContext);

    List<ViewManager> viewManagerList = new ArrayList<>();

    // Naming conflict -- add abiXX_X_X. prefix to expo.core.ViewManager manually 
    for (abi29_0_0.expo.core.ViewManager viewManager : moduleRegistry.getAllViewManagers()) {
      switch (viewManager.getViewManagerType()) {
        case GROUP:
          viewManagerList.add(new ViewGroupManagerAdapter(viewManager));
          break;
        case SIMPLE:
          viewManagerList.add(new SimpleViewManagerAdapter(viewManager));
          break;
      }
    }
    return viewManagerList;
  }
}
