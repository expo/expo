// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.keepawake

import expo.modules.kotlin.exception.Exceptions
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.currentActivity

@ExpoModule("ExpoKeepAwake")
class KeepAwakeModule : Module() {
  private val keepAwakeManager = ExpoKeepAwakeManager {
    currentActivity ?: throw Exceptions.MissingActivity()
  }

  @JS
  suspend fun activate(tag: String): Unit = keepAwakeManager.activate(tag)

  @JS
  suspend fun deactivate(tag: String): Unit = keepAwakeManager.deactivate(tag)

  @JS
  suspend fun isActivated(): Boolean = keepAwakeManager.isActivated
}
