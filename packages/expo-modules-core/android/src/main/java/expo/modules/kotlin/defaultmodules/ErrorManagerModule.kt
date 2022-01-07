package expo.modules.kotlin.defaultmodules

import android.os.Bundle
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val onNewException = "SweetErrorManager.onNewException"

class ErrorManagerModule : Module() {
  override fun definition() = ModuleDefinition {
    name("SweetErrorManager")
    events(onNewException)
  }

  fun reportExceptionToLogBox(codedException: CodedException) {
    val eventEmitter = appContext.eventEmitter(this) ?: return
    eventEmitter.emit(onNewException, Bundle().apply {
      putString("message", codedException.message ?: codedException.toString())
    })
  }
}
