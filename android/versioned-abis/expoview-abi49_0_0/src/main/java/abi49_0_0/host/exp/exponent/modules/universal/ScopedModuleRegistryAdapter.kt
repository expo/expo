package abi49_0_0.host.exp.exponent.modules.universal

import abi49_0_0.com.facebook.react.bridge.NativeModule
import abi49_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi49_0_0.com.facebook.react.uimanager.ViewManager
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
