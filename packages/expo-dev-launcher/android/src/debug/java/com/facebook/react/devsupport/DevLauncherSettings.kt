package com.facebook.react.devsupport

import android.content.Context
import com.facebook.react.packagerconnection.PackagerConnectionSettings
import expo.modules.devlauncher.react.DevLauncherPackagerConnectionSettings

internal class DevLauncherSettings(
  context: Context,
  debugServerHost: String
) : DevMenuSettingsBase(context) {
  private var connectionSettings = DevLauncherPackagerConnectionSettings(context, debugServerHost)
  override val packagerConnectionSettings: PackagerConnectionSettings
    get() = connectionSettings

  // Implemented here so `this` is not leaked
  init {
    mPreferences.registerOnSharedPreferenceChangeListener(this)
  }

  @Suppress("FunctionName")
  fun public_getPackagerConnectionSettings() = packagerConnectionSettings
}
