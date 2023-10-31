package host.exp.exponent.experience

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.adapters.react.ReactModuleRegistryProvider
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.RegistryLifecycleListener
import expo.modules.manifests.core.Manifest
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.utils.ScopedContext
import versioned.host.exp.exponent.modules.universal.ConstantsBinding
import versioned.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter
import versioned.host.exp.exponent.modules.universal.ScopedUIManagerModuleWrapper

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
    configureModuleRegistry(moduleRegistry, reactApplicationContext)
    return getNativeModulesFromModuleRegistry(reactApplicationContext, moduleRegistry, null)
  }

  protected open fun configureModuleRegistry(
    moduleRegistry: ModuleRegistry,
    reactContext: ReactApplicationContext
  ) {
    // Subclasses may add more modules here.
  }
}
