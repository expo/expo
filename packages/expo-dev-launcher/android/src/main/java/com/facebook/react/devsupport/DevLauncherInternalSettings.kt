package com.facebook.react.devsupport

import android.content.Context
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import com.facebook.react.packagerconnection.PackagerConnectionSettings
import expo.modules.devlauncher.react.DevLauncherPackagerConnectionSettings

internal class DevLauncherSettings(
  context: Context,
  debugServerHost: String
) : DeveloperSettings {

  override var isAnimationFpsDebugEnabled: Boolean = false
  override var isDeviceDebugEnabled: Boolean  = false
  override var isElementInspectorEnabled: Boolean   = false
  override var isFpsDebugEnabled: Boolean  = false
  override var isHotModuleReplacementEnabled: Boolean   = false
  override var isJSDevModeEnabled: Boolean   = false
  override var isJSMinifyEnabled: Boolean  = false
  override var isRemoteJSDebugEnabled: Boolean   = false
  override var isStartSamplingProfilerOnInit: Boolean   = false
  override val packagerConnectionSettings: PackagerConnectionSettings = PackagerConnectionSettings(context)

  override fun addMenuItem(title: String) {
  }

//  fun getPackagerConnectionSettings() = packagerConnectionSettings

  @Suppress("FunctionName")
  fun public_getPackagerConnectionSettings() = packagerConnectionSettings
}
