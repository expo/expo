package abi42_0_0.host.exp.exponent.modules.universal;

import abi42_0_0.com.facebook.react.bridge.NativeModule;
import abi42_0_0.com.facebook.react.bridge.ReactApplicationContext;

import abi42_0_0.org.unimodules.adapters.react.ModuleRegistryAdapter;
import abi42_0_0.org.unimodules.adapters.react.ReactModuleRegistryProvider;
import abi42_0_0.org.unimodules.core.ModuleRegistry;
import abi42_0_0.org.unimodules.core.interfaces.InternalModule;
import abi42_0_0.org.unimodules.core.interfaces.RegistryLifecycleListener;

import java.util.List;
import java.util.Map;

import expo.modules.manifests.core.Manifest;
import host.exp.exponent.kernel.ExperienceKey;
import abi42_0_0.host.exp.exponent.modules.api.notifications.channels.ScopedNotificationsChannelsProvider;
import host.exp.exponent.utils.ScopedContext;
import abi42_0_0.host.exp.exponent.modules.api.notifications.ScopedNotificationsCategoriesSerializer;
import abi42_0_0.host.exp.exponent.modules.universal.av.SharedCookiesDataSourceFactoryProvider;
import abi42_0_0.host.exp.exponent.modules.universal.notifications.ScopedExpoNotificationCategoriesModule;
import abi42_0_0.host.exp.exponent.modules.universal.notifications.ScopedExpoNotificationPresentationModule;
import abi42_0_0.host.exp.exponent.modules.universal.notifications.ScopedServerRegistrationModule;
import abi42_0_0.host.exp.exponent.modules.universal.notifications.ScopedNotificationScheduler;
import abi42_0_0.host.exp.exponent.modules.universal.notifications.ScopedNotificationsEmitter;
import abi42_0_0.host.exp.exponent.modules.universal.notifications.ScopedNotificationsHandler;
import abi42_0_0.host.exp.exponent.modules.universal.sensors.ScopedAccelerometerService;
import abi42_0_0.host.exp.exponent.modules.universal.sensors.ScopedGravitySensorService;
import abi42_0_0.host.exp.exponent.modules.universal.sensors.ScopedGyroscopeService;
import abi42_0_0.host.exp.exponent.modules.universal.sensors.ScopedLinearAccelerationSensorService;
import abi42_0_0.host.exp.exponent.modules.universal.sensors.ScopedMagnetometerService;
import abi42_0_0.host.exp.exponent.modules.universal.sensors.ScopedMagnetometerUncalibratedService;
import abi42_0_0.host.exp.exponent.modules.universal.sensors.ScopedRotationVectorSensorService;

public class ExpoModuleRegistryAdapter extends ModuleRegistryAdapter implements ScopedModuleRegistryAdapter {
  public ExpoModuleRegistryAdapter(ReactModuleRegistryProvider moduleRegistryProvider) {
    super(moduleRegistryProvider);
  }

  public List<NativeModule> createNativeModules(ScopedContext scopedContext, ExperienceKey experienceKey, Map<String, Object> experienceProperties, Manifest manifest, List<NativeModule> otherModules) {
    ModuleRegistry moduleRegistry = mModuleRegistryProvider.get(scopedContext);

    // Overriding sensor services from expo-sensors for scoped implementations using kernel services
    moduleRegistry.registerInternalModule(new ScopedAccelerometerService(experienceKey));
    moduleRegistry.registerInternalModule(new ScopedGravitySensorService(experienceKey));
    moduleRegistry.registerInternalModule(new ScopedGyroscopeService(experienceKey));
    moduleRegistry.registerInternalModule(new ScopedLinearAccelerationSensorService(experienceKey));
    moduleRegistry.registerInternalModule(new ScopedMagnetometerService(experienceKey));
    moduleRegistry.registerInternalModule(new ScopedMagnetometerUncalibratedService(experienceKey));
    moduleRegistry.registerInternalModule(new ScopedRotationVectorSensorService(experienceKey));
    moduleRegistry.registerInternalModule(new SharedCookiesDataSourceFactoryProvider());

    // Overriding expo-constants/ConstantsService -- binding provides manifest and other expo-related constants
    moduleRegistry.registerInternalModule(new ConstantsBinding(scopedContext, experienceProperties, manifest));

    // Overriding expo-file-system FilePermissionModule
    moduleRegistry.registerInternalModule(new ScopedFilePermissionModule(scopedContext));

    // Overriding expo-file-system FileSystemModule
    moduleRegistry.registerExportedModule(new ScopedFileSystemModule(scopedContext));

    // Overriding expo-error-recovery ErrorRecoveryModule
    moduleRegistry.registerExportedModule(new ScopedErrorRecoveryModule(scopedContext, manifest, experienceKey));

    // Overriding expo-permissions ScopedPermissionsService
    moduleRegistry.registerInternalModule(new ScopedPermissionsService(scopedContext, experienceKey));

    // Overriding expo-updates UpdatesService
    moduleRegistry.registerInternalModule(new UpdatesBinding(scopedContext, experienceProperties));

    // Overriding expo-facebook
    moduleRegistry.registerExportedModule(new ScopedFacebookModule(scopedContext));

    // Scoping Amplitude
    moduleRegistry.registerExportedModule(new ScopedAmplitudeModule(scopedContext, experienceKey));

    // Overriding expo-firebase-core
    moduleRegistry.registerInternalModule(new ScopedFirebaseCoreService(scopedContext, manifest, experienceKey));

    // Overriding expo-notifications classes
    moduleRegistry.registerExportedModule(new ScopedNotificationsEmitter(scopedContext, experienceKey));
    moduleRegistry.registerExportedModule(new ScopedNotificationsHandler(scopedContext, experienceKey));
    moduleRegistry.registerExportedModule(new ScopedNotificationScheduler(scopedContext, experienceKey));
    moduleRegistry.registerExportedModule(new ScopedExpoNotificationCategoriesModule(scopedContext, experienceKey));
    moduleRegistry.registerExportedModule(new ScopedExpoNotificationPresentationModule(scopedContext, experienceKey));
    moduleRegistry.registerExportedModule(new ScopedServerRegistrationModule(scopedContext));
    moduleRegistry.registerInternalModule(new ScopedNotificationsChannelsProvider(scopedContext, experienceKey));
    moduleRegistry.registerInternalModule(new ScopedNotificationsCategoriesSerializer());

    // Overriding expo-secure-stoore
    moduleRegistry.registerExportedModule(new ScopedSecureStoreModule(scopedContext));

    // ReactAdapterPackage requires ReactContext
    ReactApplicationContext reactContext = (ReactApplicationContext) scopedContext.getContext();
    for (InternalModule internalModule : mReactAdapterPackage.createInternalModules(reactContext)) {
      moduleRegistry.registerInternalModule(internalModule);
    }

    // Overriding ScopedUIManagerModuleWrapper from ReactAdapterPackage
    moduleRegistry.registerInternalModule(new ScopedUIManagerModuleWrapper(reactContext));

    // Adding other modules (not universal) to module registry as consumers.
    // It allows these modules to refer to universal modules.
    for (NativeModule otherModule : otherModules) {
      if (otherModule instanceof RegistryLifecycleListener) {
        moduleRegistry.registerExtraListener((RegistryLifecycleListener) otherModule);
      }
    }

    return getNativeModulesFromModuleRegistry(reactContext, moduleRegistry);
  }

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    throw new RuntimeException("Use createNativeModules(ReactApplicationContext, ExperienceId, JSONObject, List<NativeModule>) to get a list of native modules.");
  }
}
