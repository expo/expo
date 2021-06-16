package abi42_0_0.host.exp.exponent.modules.universal;

import abi42_0_0.com.facebook.react.bridge.NativeModule;
import abi42_0_0.com.facebook.react.bridge.ReactApplicationContext;

import org.json.JSONObject;
import abi42_0_0.org.unimodules.adapters.react.ModuleRegistryAdapter;
import abi42_0_0.org.unimodules.adapters.react.ReactModuleRegistryProvider;
import abi42_0_0.org.unimodules.core.ModuleRegistry;
import abi42_0_0.org.unimodules.core.interfaces.InternalModule;
import abi42_0_0.org.unimodules.core.interfaces.RegistryLifecycleListener;

import java.util.List;
import java.util.Map;

import expo.modules.updates.manifest.raw.RawManifest;
import host.exp.exponent.kernel.ExperienceId;
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

  public List<NativeModule> createNativeModules(ScopedContext scopedContext, ExperienceId experienceId, Map<String, Object> experienceProperties, RawManifest manifest, List<NativeModule> otherModules) {
    ModuleRegistry moduleRegistry = mModuleRegistryProvider.get(scopedContext);

    // Overriding sensor services from expo-sensors for scoped implementations using kernel services
    moduleRegistry.registerInternalModule(new ScopedAccelerometerService(experienceId));
    moduleRegistry.registerInternalModule(new ScopedGravitySensorService(experienceId));
    moduleRegistry.registerInternalModule(new ScopedGyroscopeService(experienceId));
    moduleRegistry.registerInternalModule(new ScopedLinearAccelerationSensorService(experienceId));
    moduleRegistry.registerInternalModule(new ScopedMagnetometerService(experienceId));
    moduleRegistry.registerInternalModule(new ScopedMagnetometerUncalibratedService(experienceId));
    moduleRegistry.registerInternalModule(new ScopedRotationVectorSensorService(experienceId));
    moduleRegistry.registerInternalModule(new SharedCookiesDataSourceFactoryProvider());

    // Overriding expo-constants/ConstantsService -- binding provides manifest and other expo-related constants
    moduleRegistry.registerInternalModule(new ConstantsBinding(scopedContext, experienceProperties, manifest));

    // Overriding expo-file-system FilePermissionModule
    moduleRegistry.registerInternalModule(new ScopedFilePermissionModule(scopedContext));

    // Overriding expo-file-system FileSystemModule
    moduleRegistry.registerExportedModule(new ScopedFileSystemModule(scopedContext));

    // Overriding expo-error-recovery ErrorRecoveryModule
    moduleRegistry.registerExportedModule(new ScopedErrorRecoveryModule(scopedContext, manifest, experienceId));

    // Overriding expo-permissions ScopedPermissionsService
    moduleRegistry.registerInternalModule(new ScopedPermissionsService(scopedContext, experienceId));

    // Overriding expo-updates UpdatesService
    moduleRegistry.registerInternalModule(new UpdatesBinding(scopedContext, experienceProperties));

    // Overriding expo-facebook
    moduleRegistry.registerExportedModule(new ScopedFacebookModule(scopedContext));

    // Scoping Amplitude
    moduleRegistry.registerExportedModule(new ScopedAmplitudeModule(scopedContext, experienceId));

    // Overriding expo-firebase-core
    moduleRegistry.registerInternalModule(new ScopedFirebaseCoreService(scopedContext, manifest, experienceId));

    // Overriding expo-notifications classes
    moduleRegistry.registerExportedModule(new ScopedNotificationsEmitter(scopedContext, experienceId));
    moduleRegistry.registerExportedModule(new ScopedNotificationsHandler(scopedContext, experienceId));
    moduleRegistry.registerExportedModule(new ScopedNotificationScheduler(scopedContext, experienceId));
    moduleRegistry.registerExportedModule(new ScopedExpoNotificationCategoriesModule(scopedContext, experienceId));
    moduleRegistry.registerExportedModule(new ScopedExpoNotificationPresentationModule(scopedContext, experienceId));
    moduleRegistry.registerExportedModule(new ScopedServerRegistrationModule(scopedContext));
    moduleRegistry.registerInternalModule(new ScopedNotificationsChannelsProvider(scopedContext, experienceId));
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
