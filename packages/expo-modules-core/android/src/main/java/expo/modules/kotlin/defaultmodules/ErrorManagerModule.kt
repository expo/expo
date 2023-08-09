package expo.modules.kotlin.defaultmodules

import android.os.Bundle
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val onNewException = "ExpoModulesCoreErrorManager.onNewException"
private const val onNewWarning = "ExpoModulesCoreErrorManager.onNewWarning"

class ErrorManagerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoModulesCoreErrorManager")
    Events(onNewException, onNewWarning)
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

  fun reportWarningToLogBox(warning: String) {
    val eventEmitter = appContext.eventEmitter(this) ?: return
    eventEmitter.emit(
      onNewWarning,
      Bundle().apply {
        putString("message", warning)
      }
    )
  }
}
