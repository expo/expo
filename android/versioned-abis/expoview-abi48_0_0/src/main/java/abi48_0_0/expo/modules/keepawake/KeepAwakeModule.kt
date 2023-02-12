// Copyright 2015-present 650 Industries. All rights reserved.
package abi48_0_0.expo.modules.keepawake

import android.content.Context

import abi48_0_0.expo.modules.core.ExportedModule
import abi48_0_0.expo.modules.core.ModuleRegistry
import abi48_0_0.expo.modules.core.interfaces.services.KeepAwakeManager
import abi48_0_0.expo.modules.core.ModuleRegistryDelegate
import abi48_0_0.expo.modules.core.Promise
import abi48_0_0.expo.modules.core.interfaces.ExpoMethod
import abi48_0_0.expo.modules.core.errors.CurrentActivityNotFoundException

private const val NAME = "ExpoKeepAwake"
private const val NO_ACTIVITY_ERROR_CODE = "NO_CURRENT_ACTIVITY"

class KeepAwakeModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context) {

  private val keepAwakeManager: KeepAwakeManager by moduleRegistry()

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  override fun getName(): String {
    return NAME
  }

  @ExpoMethod
  fun activate(tag: String, promise: Promise) {
    try {
      keepAwakeManager.activate(tag) { promise.resolve(true) }
    } catch (ex: CurrentActivityNotFoundException) {
      promise.reject(NO_ACTIVITY_ERROR_CODE, "Unable to activate keep awake")
    }
  }

  @ExpoMethod
  fun deactivate(tag: String, promise: Promise) {
    try {
      keepAwakeManager.deactivate(tag) { promise.resolve(true) }
    } catch (ex: CurrentActivityNotFoundException) {
      promise.reject(NO_ACTIVITY_ERROR_CODE, "Unable to deactivate keep awake. However, it probably is deactivated already.")
    }
  }

  val isActivated: Boolean
    get() = keepAwakeManager.isActivated
}
