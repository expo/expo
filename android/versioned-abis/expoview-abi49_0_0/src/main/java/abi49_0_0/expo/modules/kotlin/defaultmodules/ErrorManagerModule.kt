package abi49_0_0.expo.modules.kotlin.defaultmodules

import android.os.Bundle
import abi49_0_0.expo.modules.kotlin.exception.CodedException
import abi49_0_0.expo.modules.kotlin.modules.Module
import abi49_0_0.expo.modules.kotlin.modules.ModuleDefinition

private const val onNewException = "ExpoModulesCoreErrorManager.onNewException"

class ErrorManagerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoModulesCoreErrorManager")
    Events(onNewException)
  }

  fun reportExceptionToLogBox(codedException: CodedException) {
    val eventEmitter = appContext.eventEmitter(this) ?: return
    eventEmitter.emit(
      onNewException,
      Bundle().apply {
        putString("message", codedException.message ?: codedException.toString())
      }
    )
  }
}
