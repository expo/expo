package expo.modules.kotlin.defaultmodules

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

internal const val NativeModulesProxyModuleName = "NativeModulesProxy"

class NativeModulesProxyModule : Module() {
  override fun definition() = ModuleDefinition {
    Name(NativeModulesProxyModuleName)

    Constants {
      appContext.legacyModulesProxyHolder?.get()?.constants ?: emptyMap()
    }
  }
}
