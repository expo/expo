package expo.modules.updates.logging

import android.util.Log

/**
 * Log types (levels) for expo-updates logs
 * These correspond to ExpoModulesCore.LogType in iOS
 */
enum class UpdatesLogType(val type: String) {
  Trace("trace"),
  Timer("timer"),
  Stacktrace("stacktrace"),
  Debug("debug"),
  Info("info"),
  Warn("warn"),
  Error("error"),
  Fatal("fatal");

  companion object {
    fun toOSLogType(type: UpdatesLogType): Int {
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
