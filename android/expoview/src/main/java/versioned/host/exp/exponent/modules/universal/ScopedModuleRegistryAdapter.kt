package versioned.host.exp.exponent.modules.universal

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import expo.modules.manifests.core.Manifest
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.utils.ScopedContext

interface ScopedModuleRegistryAdapter {
  fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>>
  fun createNativeModules(
    scopedContext: ScopedContext,
    experienceKey: ExperienceKey,
    experienceProperties: Map<String, Any?>,
    manifest: Manifest,
    otherModules: List<NativeModule>
  ): List<NativeModule>
}
