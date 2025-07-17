package expo.modules.devlauncher.launcher.errors

import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.google.gson.Gson
import expo.modules.devlauncher.launcher.DevLauncherRecentlyOpenedAppsRegistry
import androidx.core.content.edit

private const val ERROR_REGISTRY_SHARED_PREFERENCES = "expo.modules.devlauncher.errorregistry"
private const val ERROR_REGISTRY_SHARED_PREFERENCES_KEY = "SavedError"

data class DevLauncherErrorInstance(
  val throwable: Throwable,
  val timestamp: Long = DevLauncherRecentlyOpenedAppsRegistry.TimeHelper.getCurrentTime()
) {
  fun toWritableMap(): WritableMap? = Arguments.fromBundle(
    Bundle().apply {
      putLong("timestamp", timestamp)
      putString("message", throwable.message ?: "Unknown")
      putString("stack", throwable.stackTraceToString())
    }
  )
}

class DevLauncherErrorRegistry(context: Context) {
  private val sharedPreferences: SharedPreferences = context
    .getSharedPreferences(
      ERROR_REGISTRY_SHARED_PREFERENCES,
      Context.MODE_PRIVATE
    )

  fun storeException(throwable: Throwable) {
    val errorInstance = DevLauncherErrorInstance(throwable)
    val jsonString = Gson().toJson(errorInstance)

    sharedPreferences
      .edit(commit = true) {
        putString(ERROR_REGISTRY_SHARED_PREFERENCES_KEY, jsonString)
      }
  }

  fun consumeException(): DevLauncherErrorInstance? {
    val jsonString = sharedPreferences.getString(ERROR_REGISTRY_SHARED_PREFERENCES_KEY, null)
      ?: return null

    try {
      return Gson().fromJson(jsonString, DevLauncherErrorInstance::class.java)
    } finally {
      sharedPreferences
        .edit(commit = true) {
          remove(ERROR_REGISTRY_SHARED_PREFERENCES_KEY)
        }
    }
  }
}
