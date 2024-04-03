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
    sendEvent(
      onNewException,
      Bundle().apply {
        putString("message", codedException.message ?: codedException.toString())
      }
    )
  }

  fun reportWarningToLogBox(warning: String) {
    sendEvent(
      onNewWarning,
      Bundle().apply {
        putString("message", warning)
      }
    )
  }
}
