package abi48_0_0.host.exp.exponent.modules.universal

import abi48_0_0.com.facebook.react.bridge.NativeModule
import abi48_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi48_0_0.expo.modules.adapters.react.ModuleRegistryAdapter
import abi48_0_0.expo.modules.adapters.react.ReactModuleRegistryProvider
import abi48_0_0.expo.modules.core.interfaces.RegistryLifecycleListener
import abi48_0_0.expo.modules.kotlin.ModulesProvider
import expo.modules.manifests.core.Manifest
import host.exp.exponent.utils.ScopedContext
import host.exp.exponent.kernel.ExperienceKey
import abi48_0_0.host.exp.exponent.modules.api.notifications.ScopedNotificationsCategoriesSerializer
import abi48_0_0.host.exp.exponent.modules.api.notifications.channels.ScopedNotificationsChannelsProvider
import abi48_0_0.host.exp.exponent.modules.universal.av.SharedCookiesDataSourceFactoryProvider
import abi48_0_0.host.exp.exponent.modules.universal.notifications.*
import abi48_0_0.host.exp.exponent.modules.universal.sensors.*
import java.lang.RuntimeException

open class ExpoModuleRegistryAdapter(moduleRegistryProvider: ReactModuleRegistryProvider?, modulesProvider: ModulesProvider? = null) :
  ModuleRegistryAdapter(moduleRegistryProvider, modulesProvider), ScopedModuleRegistryAdapter {
  override fun createNativeModules(
    scopedContext: ScopedContext,
    experienceKey: ExperienceKey,
    experienceProperties: Map<String, Any?>,
    manifest: Manifest,
    otherModules: List<NativeModule>
  ): List<NativeModule> {
    val moduleRegistry = mModuleRegistryProvider[scopedContext]

    // Overriding sensor services from expo-sensors for scoped implementations using kernel services
    moduleRegistry.registerInternalModule(ScopedAccelerometerService(experienceKey))
    moduleRegistry.registerInternalModule(ScopedGravitySensorService(experienceKey))
    moduleRegistry.registerInternalModule(ScopedGyroscopeService(experienceKey))
    moduleRegistry.registerInternalModule(ScopedLinearAccelerationSensorService(experienceKey))
    moduleRegistry.registerInternalModule(ScopedMagnetometerService(experienceKey))
    moduleRegistry.registerInternalModule(ScopedMagnetometerUncalibratedService(experienceKey))
    moduleRegistry.registerInternalModule(ScopedRotationVectorSensorService(experienceKey))
    moduleRegistry.registerInternalModule(SharedCookiesDataSourceFactoryProvider())

    // Overriding expo-constants/ConstantsService -- binding provides manifest and other expo-related constants
    moduleRegistry.registerInternalModule(ConstantsBinding(scopedContext, experienceProperties, manifest))

    // Overriding expo-file-system FilePermissionModule
    moduleRegistry.registerInternalModule(ScopedFilePermissionModule(scopedContext))

    // Overriding expo-file-system FileSystemModule
    moduleRegistry.registerExportedModule(ScopedFileSystemModule(scopedContext))

    // Overriding expo-permissions ScopedPermissionsService
    moduleRegistry.registerInternalModule(ScopedPermissionsService(scopedContext, experienceKey))

    // Overriding expo-updates UpdatesService
    moduleRegistry.registerInternalModule(UpdatesBinding(scopedContext, experienceProperties))

    // Overriding expo-notifications classes
    moduleRegistry.registerExportedModule(ScopedNotificationsEmitter(scopedContext, experienceKey))
    moduleRegistry.registerExportedModule(ScopedNotificationsHandler(scopedContext, experienceKey))
    moduleRegistry.registerExportedModule(ScopedNotificationScheduler(scopedContext, experienceKey))
    moduleRegistry.registerExportedModule(ScopedExpoNotificationCategoriesModule(scopedContext, experienceKey))
    moduleRegistry.registerExportedModule(ScopedExpoNotificationPresentationModule(scopedContext, experienceKey))
    moduleRegistry.registerExportedModule(ScopedServerRegistrationModule(scopedContext))
    moduleRegistry.registerInternalModule(ScopedNotificationsChannelsProvider(scopedContext, experienceKey))
    moduleRegistry.registerInternalModule(ScopedNotificationsCategoriesSerializer())

    // Overriding expo-secure-stoore
    moduleRegistry.registerExportedModule(ScopedSecureStoreModule(scopedContext))

    // ReactAdapterPackage requires ReactContext
    val reactContext = scopedContext.context as ReactApplicationContext
    for (internalModule in mReactAdapterPackage.createInternalModules(reactContext)) {
      moduleRegistry.registerInternalModule(internalModule)
    }

    // Overriding ScopedUIManagerModuleWrapper from ReactAdapterPackage
    moduleRegistry.registerInternalModule(ScopedUIManagerModuleWrapper(reactContext))

    // Adding other modules (not universal) to module registry as consumers.
    // It allows these modules to refer to universal modules.
    for (otherModule in otherModules) {
      if (otherModule is RegistryLifecycleListener) {
        moduleRegistry.registerExtraListener(otherModule as RegistryLifecycleListener)
      }
    }
    return getNativeModulesFromModuleRegistry(reactContext, moduleRegistry)
  }

  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    throw RuntimeException("Use other implementation of createNativeModules to get a list of native modules.")
  }
}
