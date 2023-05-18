@file:Suppress("RedundantVisibilityModifier")

package com.facebook.react.devsupport

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import com.facebook.react.packagerconnection.PackagerConnectionSettings
import expo.modules.devmenu.react.DevMenuPackagerConnectionSettings

/**
 * Class representing react's internal [DevInternalSettings] class, which we want to replace to change [packagerConnectionSettings] and others settings.
 * It is only use when [expo.modules.devmenu.DevMenuHost.getUseDeveloperSupport] returns true.
 */
internal class DevMenuReactInternalSettings(
  serverIp: String,
  application: Context
) : DevInternalSettings(application, {}) {
  private val packagerConnectionSettings = DevMenuPackagerConnectionSettings(serverIp, application)

  override fun isElementInspectorEnabled() = false

  override fun isJSMinifyEnabled() = false

  override fun setRemoteJSDebugEnabled(remoteJSDebugEnabled: Boolean) = Unit

  override fun isJSDevModeEnabled() = true

  override fun isStartSamplingProfilerOnInit() = false

  override fun setElementInspectorEnabled(enabled: Boolean) = Unit

  override fun isAnimationFpsDebugEnabled() = false

  override fun setJSDevModeEnabled(value: Boolean) = Unit

  override fun setFpsDebugEnabled(enabled: Boolean) = Unit

  override fun onSharedPreferenceChanged(sharedPreferences: SharedPreferences?, key: String?) = Unit

  override fun isRemoteJSDebugEnabled() = false

  override fun isHotModuleReplacementEnabled() = true

  override fun setHotModuleReplacementEnabled(enabled: Boolean) = Unit

  override fun addMenuItem(title: String?) = Unit

  override fun isFpsDebugEnabled() = false

  override fun getPackagerConnectionSettings() = packagerConnectionSettings
}

/**
 * A wrapper of [DevInternalSettings] allows us to access the package-private [DevInternalSettings] properties
 */
internal class DevMenuInternalSettingsWrapper(private val devSettings: DevInternalSettings) {
  constructor(developerSettings: DeveloperSettings) : this(developerSettings as DevInternalSettings)

  val isFpsDebugEnabled = devSettings.isFpsDebugEnabled
  var isHotModuleReplacementEnabled: Boolean
    get() = devSettings.isHotModuleReplacementEnabled
    set(value) {
      devSettings.isHotModuleReplacementEnabled = value
    }

  var isRemoteJSDebugEnabled: Boolean
    get() = devSettings.isRemoteJSDebugEnabled
    set(value) {
      devSettings.isRemoteJSDebugEnabled = value
    }
  val packagerConnectionSettings: PackagerConnectionSettings = devSettings.packagerConnectionSettings
}
