package com.facebook.react.devsupport

import android.content.Context
import com.facebook.react.packagerconnection.PackagerConnectionSettings

internal class DevLauncherSettings(
  context: Context,
  debugServerHost: String
) : DevMenuSettingsBase(context) {
  private var connectionSettings = PackagerConnectionSettings(context)
  override val packagerConnectionSettings: PackagerConnectionSettings
    get() = connectionSettings

  // Implemented here so `this` is not leaked
  init {
    // We can't extend PackagerConnectionSettings anymore, because now it's final class
    // So we need to update the debugServerHost on init
    packagerConnectionSettings.debugServerHost = debugServerHost

    mPreferences.registerOnSharedPreferenceChangeListener(this)
  }

  @Suppress("FunctionName")
  fun public_getPackagerConnectionSettings() = packagerConnectionSettings
}
