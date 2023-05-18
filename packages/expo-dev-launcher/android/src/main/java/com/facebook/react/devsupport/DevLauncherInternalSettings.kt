package com.facebook.react.devsupport

import android.content.Context
import com.facebook.react.packagerconnection.PackagerConnectionSettings
import expo.modules.devlauncher.react.DevLauncherPackagerConnectionSettings

internal class DevLauncherInternalSettings(
  context: Context,
  debugServerHost: String
) : DevInternalSettings(context, null) {
  private var packagerConnectionSettings = DevLauncherPackagerConnectionSettings(context, debugServerHost)

  override fun getPackagerConnectionSettings() = packagerConnectionSettings
}

/**
 * A wrapper of [DevInternalSettings] allows us to access the package-private [DevInternalSettings] properties
 */
internal class DevLauncherInternalSettingsWrapper(private val devSettings: DevInternalSettings) {
  val isStartSamplingProfilerOnInit = devSettings.isStartSamplingProfilerOnInit
  var isRemoteJSDebugEnabled: Boolean
    get() = devSettings.isRemoteJSDebugEnabled
    set(value) {
      devSettings.isRemoteJSDebugEnabled = value
    }
  val packagerConnectionSettings: PackagerConnectionSettings = devSettings.packagerConnectionSettings
}
