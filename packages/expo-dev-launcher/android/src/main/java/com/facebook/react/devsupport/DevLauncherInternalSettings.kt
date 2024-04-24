package com.facebook.react.devsupport

import android.content.Context
import com.facebook.react.devsupport.DevInternalSettings.Listener
import expo.modules.devlauncher.react.DevLauncherPackagerConnectionSettings

internal class DevLauncherInternalSettings(
  context: Context,
  debugServerHost: String
) : DevInternalSettings(context, Listener {}) {
  private var packagerConnectionSettings = DevLauncherPackagerConnectionSettings(context, debugServerHost)

  override fun getPackagerConnectionSettings() = packagerConnectionSettings

  @Suppress("FunctionName")
  fun public_getPackagerConnectionSettings() = getPackagerConnectionSettings()
}
