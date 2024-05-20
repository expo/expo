package versioned.host.exp.exponent.modules.universal

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.adapters.react.ModuleRegistryAdapter
import expo.modules.adapters.react.ReactModuleRegistryProvider
import expo.modules.core.interfaces.RegistryLifecycleListener
import expo.modules.kotlin.ModulesProvider
import expo.modules.manifests.core.Manifest
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.utils.ScopedContext
import versioned.host.exp.exponent.core.modules.ExpoGoModule
import versioned.host.exp.exponent.core.modules.ExpoGoUpdatesModule
import versioned.host.exp.exponent.modules.api.notifications.ScopedNotificationsCategoriesSerializer
import versioned.host.exp.exponent.modules.api.notifications.channels.ScopedNotificationsChannelsProvider
import versioned.host.exp.exponent.modules.universal.av.SharedCookiesDataSourceFactoryProvider
import versioned.host.exp.exponent.modules.universal.notifications.ScopedExpoNotificationCategoriesModule
import versioned.host.exp.exponent.modules.universal.notifications.ScopedExpoNotificationPresentationModule
import versioned.host.exp.exponent.modules.universal.notifications.ScopedNotificationScheduler
import versioned.host.exp.exponent.modules.universal.notifications.ScopedNotificationsEmitter
import versioned.host.exp.exponent.modules.universal.notifications.ScopedNotificationsHandler
import versioned.host.exp.exponent.modules.universal.notifications.ScopedServerRegistrationModule
import versioned.host.exp.exponent.modules.universal.sensors.ScopedAccelerometerService
import versioned.host.exp.exponent.modules.universal.sensors.ScopedGravitySensorService
import versioned.host.exp.exponent.modules.universal.sensors.ScopedGyroscopeService
import versioned.host.exp.exponent.modules.universal.sensors.ScopedLinearAccelerationSensorService
import versioned.host.exp.exponent.modules.universal.sensors.ScopedMagnetometerService
import versioned.host.exp.exponent.modules.universal.sensors.ScopedMagnetometerUncalibratedService
import versioned.host.exp.exponent.modules.universal.sensors.ScopedRotationVectorSensorService

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

    // Overriding expo-permissions ScopedPermissionsService
    moduleRegistry.registerInternalModule(ScopedPermissionsService(scopedContext, experienceKey))

    // Overriding expo-notifications classes
    moduleRegistry.registerInternalModule(ScopedNotificationsChannelsProvider(scopedContext, experienceKey))
    moduleRegistry.registerInternalModule(ScopedNotificationsCategoriesSerializer())

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
    return getNativeModulesFromModuleRegistry(
      reactContext,
      moduleRegistry
    ) { appContext ->
      with(appContext.registry) {
        register(
          ExpoGoModule(manifest),
          ExpoGoUpdatesModule(experienceProperties),
          ScopedSecureStoreModule(scopedContext)
        )

        // Notifications
        register(
          ScopedNotificationsEmitter(scopedContext, experienceKey),
          ScopedNotificationsHandler(scopedContext, experienceKey),
          ScopedServerRegistrationModule(),
          ScopedNotificationScheduler(scopedContext, experienceKey),
          ScopedExpoNotificationPresentationModule(scopedContext, experienceKey),
          ScopedExpoNotificationCategoriesModule(experienceKey)
        )
      }
    }
  }

  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    throw RuntimeException("Use other implementation of createNativeModules to get a list of native modules.")
  }
}
