@file:Suppress("RedundantVisibilityModifier")

package com.facebook.react.devsupport

import android.content.Context
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import com.facebook.react.packagerconnection.PackagerConnectionSettings
import expo.modules.devmenu.react.DevMenuPackagerConnectionSettings

/**
 * Class representing react's DevSettings class, which we want to replace to change [packagerConnectionSettings] and others settings.
 * It is only use when [expo.modules.devmenu.DevMenuReactNativeHost.getUseDeveloperSupport] returns true.
 */
internal class DevMenuReactSettings(
  serverIp: String,
  application: Context
) : DeveloperSettings {
  override val packagerConnectionSettings = DevMenuPackagerConnectionSettings(serverIp, application)

  override var isElementInspectorEnabled = false

  override var isJSMinifyEnabled = false

  override var isJSDevModeEnabled = true

  override var isStartSamplingProfilerOnInit = false

  override var isAnimationFpsDebugEnabled = false

  override var isDeviceDebugEnabled = false

  override var isRemoteJSDebugEnabled = false

  override var isHotModuleReplacementEnabled = true

  override var isFpsDebugEnabled = false

  override fun addMenuItem(title: String) {
  }
}

/**
 * A wrapper of [DevInternalSettings] allows us to access the package-private [DevInternalSettings] properties
 */
internal class DevMenuInternalSettingsWrapper(private val devSettings: DeveloperSettings) {

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

  var isJSDevModeEnabled: Boolean
    get() = devSettings.isJSDevModeEnabled
    set(value) {
      devSettings.isJSDevModeEnabled = value
    }

  val packagerConnectionSettings: PackagerConnectionSettings = devSettings.packagerConnectionSettings
}
