// Copyright 2022-present 650 Industries. All rights reserved.

// Log types (levels) for expo-updates logs
// These correspond to ExpoModulesCore.LogType in iOS

package expo.modules.updates.logging

import android.util.Log

enum class UpdatesLogType(val type: Int) {
  Trace(0),
  Timer(1),
  Stacktrace(2),
  Debug(3),
  Info(4),
  Warn(5),
  Error(6),
  Fatal(7);

  companion object {
    fun asString(type: UpdatesLogType): String {
      return when (type) {
        Trace -> "trace"
        Timer -> "timer"
        Stacktrace -> "stacktrace"
        Debug -> "debug"
        Info -> "info"
        Warn -> "warn"
        Error -> "error"
        Fatal -> "fatal"
      }
    }

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
