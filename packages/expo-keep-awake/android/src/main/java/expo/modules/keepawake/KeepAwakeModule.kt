// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.keepawake

import android.content.Context

import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.services.KeepAwakeManager
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.errors.CurrentActivityNotFoundException

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
