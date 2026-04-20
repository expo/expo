package expo.modules.appmetrics

import android.content.Context
import androidx.core.content.edit

private const val PREFS_NAME = "dev.expo.app-metrics"
private const val KEY_ENVIRONMENT = "environment"

object AppMetricsPreferences {
  fun getEnvironment(context: Context): String? {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    return prefs.getString(KEY_ENVIRONMENT, null) ?: getDefaultEnvironment()
  }

  fun setEnvironment(
    context: Context,
    environment: String
  ) {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    prefs.edit(commit = true) { putString(KEY_ENVIRONMENT, environment) }
  }

  fun getDefaultEnvironment(): String? {
    return if (BuildConfig.DEBUG) "development" else null
  }
}
