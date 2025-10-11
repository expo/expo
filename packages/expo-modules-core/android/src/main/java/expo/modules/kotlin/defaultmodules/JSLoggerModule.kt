package expo.modules.kotlin.defaultmodules

import android.os.Bundle
import expo.modules.core.logging.LogHandler
import expo.modules.core.logging.LogType
import expo.modules.core.logging.Logger
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.lang.ref.WeakReference

internal const val JSLoggerModuleName = "ExpoModulesCoreJSLogger"
private const val onNewError = "$JSLoggerModuleName.onNewError"
private const val onNewWarning = "$JSLoggerModuleName.onNewWarning"
private const val onNewDebug = "$JSLoggerModuleName.onNewDebug"
private const val onNewInfo = "$JSLoggerModuleName.onNewInfo"
private const val onNewTrace = "$JSLoggerModuleName.onNewTrace"

@Deprecated("Use JSLoggerModule instead")
typealias ErrorManagerModule = JSLoggerModule

class JSLoggerModule : Module() {
  private class JSLogHandler(module: JSLoggerModule) : LogHandler() {
    private val moduleReference = WeakReference(module)

    override fun log(type: LogType, message: String, cause: Throwable?) {
      val finalMessage = if (cause != null) {
        "$message. ${cause.message}"
      } else {
        message
      }
      moduleReference.get()?.reportToLogBox(type, finalMessage)
    }
  }

  var logger: Logger? = null
    private set

  override fun definition() = ModuleDefinition {
    Name(JSLoggerModuleName)

    Events(onNewError, onNewWarning, onNewDebug, onNewInfo, onNewTrace)

    OnCreate {
      val logHandler = JSLogHandler(this@JSLoggerModule)
      logger = Logger(listOf(logHandler))
    }
  }

  @Deprecated("Use appContext.jsLogger.warn(...) instead")
  fun reportWarningToLogBox(warning: String) {
    sendEvent(
      onNewWarning,
      createMessageBundle(warning)
    )
  }

  @Deprecated("Use appContext.jsLogger.error(...) instead")
  fun reportExceptionToLogBox(codedException: CodedException) {
    sendEvent(
      onNewError,
      createMessageBundle(codedException.message ?: codedException.toString())
    )
  }

  private fun createMessageBundle(message: String): Bundle {
    return Bundle().apply {
      putString("message", message)
    }
  }

  private fun reportToLogBox(type: LogType, message: String) {
    sendEvent(
      type.eventName,
      Bundle().apply {
        putString("message", message)
      }
    )
  }
}

private val LogType.eventName: String
  get() = when (this) {
    LogType.Trace -> onNewTrace
    LogType.Timer -> onNewDebug
    LogType.Stacktrace -> onNewTrace
    LogType.Debug -> onNewDebug
    LogType.Info -> onNewInfo
    LogType.Warn -> onNewWarning
    LogType.Error -> onNewError
    LogType.Fatal -> onNewError
  }
