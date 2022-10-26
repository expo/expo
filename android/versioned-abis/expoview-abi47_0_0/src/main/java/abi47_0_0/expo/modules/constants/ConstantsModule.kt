// Copyright 2015-present 650 Industries. All rights reserved.
package abi47_0_0.expo.modules.constants

import android.content.Context

import abi47_0_0.expo.modules.core.ExportedModule
import abi47_0_0.expo.modules.core.ModuleRegistry
import abi47_0_0.expo.modules.core.ModuleRegistryDelegate
import abi47_0_0.expo.modules.core.Promise
import abi47_0_0.expo.modules.interfaces.constants.ConstantsInterface
import abi47_0_0.expo.modules.core.interfaces.ExpoMethod

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
