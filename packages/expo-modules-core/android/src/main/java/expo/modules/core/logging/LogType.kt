package expo.modules.core.logging

import android.util.Log

/**
 * Log types (levels)
 * These correspond to ExpoModulesCore.LogType in iOS
 */
enum class LogType(val type: String) {
  Trace("trace"),
  Timer("timer"),
  Stacktrace("stacktrace"),
  Debug("debug"),
  Info("info"),
  Warn("warn"),
  Error("error"),
  Fatal("fatal");

  companion object {
    fun toOSLogType(type: LogType): Int {
      return when (type) {
        Trace -> Log.DEBUG
        Timer -> Log.DEBUG
        Stacktrace -> Log.DEBUG
        Debug -> Log.DEBUG
        Info -> Log.INFO
        Warn -> Log.WARN
        Error -> Log.ERROR
        Fatal -> Log.ASSERT
      }
    }
  }
}
