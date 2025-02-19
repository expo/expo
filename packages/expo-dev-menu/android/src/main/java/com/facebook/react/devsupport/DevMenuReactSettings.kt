@file:Suppress("RedundantVisibilityModifier")

package com.facebook.react.devsupport

import android.content.Context
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import com.facebook.react.packagerconnection.PackagerConnectionSettings
import expo.modules.devmenu.react.DevMenuPackagerConnectionSettings

/**
 * Class representing react's internal [DevInternalSettings] class, which we want to replace to change [packagerConnectionSettings] and others settings.
 * It is only use when [expo.modules.devmenu.DevMenuReactNativeHost.getUseDeveloperSupport] returns true.
 * Implementation has been copied from reacts internal [DevInternalSettings] class
 */

internal class DevMenuReactSettings(
  context: Context,
  serverIp: String
) : DevMenuSettingsBase(context) {
  override val packagerConnectionSettings = DevMenuPackagerConnectionSettings(serverIp, context)

  // Implemented here so `this` is not leaked
  init {
    mPreferences.registerOnSharedPreferenceChangeListener(this)
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

  var isJSDevModeEnabled: Boolean
    get() = devSettings.isJSDevModeEnabled
    set(value) {
      devSettings.isJSDevModeEnabled = value
    }

  val packagerConnectionSettings: PackagerConnectionSettings = devSettings.packagerConnectionSettings
}
