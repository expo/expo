// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.keepawake

import expo.modules.core.errors.CurrentActivityNotFoundException
import expo.modules.core.interfaces.services.KeepAwakeManager
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KeepAwakeModule : Module() {
  private val keepAwakeManager: KeepAwakeManager
    get() = appContext.legacyModule() ?: throw MissingModuleException("KeepAwakeManager")

  override fun definition() = ModuleDefinition {
    Name("ExpoKeepAwake")

    AsyncFunction("activate") { tag: String, promise: Promise ->
      try {
        keepAwakeManager.activate(tag) { promise.resolve(true) }
      } catch (ex: CurrentActivityNotFoundException) {
        promise.reject(ActivateKeepAwakeException())
      }
    }

    AsyncFunction("deactivate") { tag: String, promise: Promise ->
      try {
        keepAwakeManager.deactivate(tag) { promise.resolve(true) }
      } catch (ex: CurrentActivityNotFoundException) {
        promise.reject(DeactivateKeepAwakeException())
      }
    }

    AsyncFunction<Boolean>("isActivated") {
      return@AsyncFunction keepAwakeManager.isActivated
    }
  }
}
