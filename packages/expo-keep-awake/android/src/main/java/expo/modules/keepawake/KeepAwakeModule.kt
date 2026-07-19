// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.keepawake

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class KeepAwakeModule : Module() {
  private val keepAwakeManager by lazy { ExpoKeepAwakeManager(appContext) }

  override fun definition() = ModuleDefinition {
    Name("ExpoKeepAwake")

    AsyncFunction("activate") { tag: String ->
      keepAwakeManager.activate(tag)
    }

    AsyncFunction("deactivate") { tag: String ->
      keepAwakeManager.deactivate(tag)
    }

    AsyncFunction<Boolean>("isActivated") {
      keepAwakeManager.isActivated
    }
  }
}
