package host.exp.exponent.experience

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.adapters.react.ReactModuleRegistryProvider
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.RegistryLifecycleListener
import expo.modules.notifications.notifications.categories.ExpoNotificationCategoriesModule
import expo.modules.notifications.notifications.handling.NotificationsHandler
import expo.modules.notifications.notifications.scheduling.NotificationScheduler
import host.exp.exponent.utils.ScopedContext
import host.exp.exponent.kernel.ExperienceKey
import expo.modules.manifests.core.Manifest
import versioned.host.exp.exponent.modules.universal.*
import versioned.host.exp.exponent.modules.universal.notifications.ScopedServerRegistrationModule

open class DetachedModuleRegistryAdapter(moduleRegistryProvider: ReactModuleRegistryProvider) :
  ExpoModuleRegistryAdapter(moduleRegistryProvider) {

  override fun createNativeModules(
    scopedContext: ScopedContext,
    experienceKey: ExperienceKey,
    experienceProperties: Map<String, Any?>,
    manifest: Manifest,
    otherModules: List<NativeModule>
  ): List<NativeModule> {
    val reactApplicationContext = scopedContext.context as ReactApplicationContext

    // We only use React application context, because we're detached -- no scopes
    val moduleRegistry = mModuleRegistryProvider[reactApplicationContext]

    moduleRegistry.registerInternalModule(
      ConstantsBinding(
        scopedContext,
        experienceProperties,
        manifest
      )
    )

    // Overriding expo-updates UpdatesService
    moduleRegistry.registerInternalModule(UpdatesBinding(scopedContext, experienceProperties))

    // ReactAdapterPackage requires ReactContext
    val reactContext = scopedContext.context as ReactApplicationContext
    for (internalModule in mReactAdapterPackage.createInternalModules(reactContext)) {
      moduleRegistry.registerInternalModule(internalModule)
    }

    // Overriding ScopedUIManagerModuleWrapper from ReactAdapterPackage
    moduleRegistry.registerInternalModule(ScopedUIManagerModuleWrapper(reactContext))

    // Overriding expo-secure-store
    moduleRegistry.registerExportedModule(ScopedSecureStoreModule(scopedContext))

    // Certain notifications classes should share `SharedPreferences` object with the notifications services, so we don't want to use scoped context.
    moduleRegistry.registerExportedModule(NotificationScheduler(scopedContext.baseContext))
    moduleRegistry.registerExportedModule(ExpoNotificationCategoriesModule(scopedContext.baseContext))
    moduleRegistry.registerExportedModule(NotificationsHandler(scopedContext.baseContext))
    // We consciously pass scoped context to ScopedServerRegistrationModule
    // so it can access legacy scoped backed-up storage and migrates
    // the legacy UUID to scoped non-backed-up storage.
    moduleRegistry.registerExportedModule(ScopedServerRegistrationModule(scopedContext))

    // Adding other modules (not universal) to module registry as consumers.
    // It allows these modules to refer to universal modules.
    for (otherModule in otherModules) {
      if (otherModule is RegistryLifecycleListener) {
        moduleRegistry.registerExtraListener(otherModule as RegistryLifecycleListener)
      }
    }
    configureModuleRegistry(moduleRegistry, reactApplicationContext)
    return getNativeModulesFromModuleRegistry(reactApplicationContext, moduleRegistry)
  }

  protected open fun configureModuleRegistry(
    moduleRegistry: ModuleRegistry,
    reactContext: ReactApplicationContext
  ) {
    // Subclasses may add more modules here.
  }
}
