// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.constants

import android.content.Context

import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.Promise
import expo.modules.interfaces.constants.ConstantsInterface
import expo.modules.core.interfaces.ExpoMethod

class ConstantsModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context) {

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  private val constantsService: ConstantsInterface by moduleRegistry()

  override fun getConstants(): Map<String, Any> = constantsService.constants

  override fun getName() = "ExponentConstants"

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  @ExpoMethod
  fun getWebViewUserAgentAsync(promise: Promise) {
    val userAgent = System.getProperty("http.agent")
    promise.resolve(userAgent)
  }
}
