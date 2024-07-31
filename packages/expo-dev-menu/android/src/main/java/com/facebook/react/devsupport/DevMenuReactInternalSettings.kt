@file:Suppress("RedundantVisibilityModifier")

package com.facebook.react.devsupport

import android.content.Context
import android.content.SharedPreferences
import android.content.SharedPreferences.OnSharedPreferenceChangeListener
import android.preference.PreferenceManager
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import com.facebook.react.packagerconnection.PackagerConnectionSettings
import expo.modules.devmenu.react.DevMenuPackagerConnectionSettings

/**
 * Class representing react's internal [DevInternalSettings] class, which we want to replace to change [packagerConnectionSettings] and others settings.
 * It is only use when [expo.modules.devmenu.DevMenuReactNativeHost.getUseDeveloperSupport] returns true.
 */
internal class DevMenuReactSettings(
  context: Context,
  serverIp: String,
  private val listener: Listener? = Listener {}
) : DeveloperSettings, OnSharedPreferenceChangeListener {
  private val mPreferences: SharedPreferences = PreferenceManager.getDefaultSharedPreferences(context)
  override val packagerConnectionSettings = DevMenuPackagerConnectionSettings(serverIp, context)

  init {
    mPreferences.registerOnSharedPreferenceChangeListener(this)
  }

  override var isFpsDebugEnabled: Boolean
    get() = mPreferences.getBoolean("fps_debug", false)
    set(enabled) {
      mPreferences.edit().putBoolean("fps_debug", enabled).apply()
    }

  override var isAnimationFpsDebugEnabled = mPreferences.getBoolean("animations_debug", false)

  override var isJSDevModeEnabled: Boolean
    get() = mPreferences.getBoolean("js_dev_mode_debug", true)
    set(value) {
      mPreferences.edit().putBoolean("js_dev_mode_debug", value).apply()
    }

  override var isJSMinifyEnabled: Boolean = mPreferences.getBoolean("js_minify_debug", false)

  override fun onSharedPreferenceChanged(sharedPreferences: SharedPreferences, key: String?) {
    if (this.listener != null && ("fps_debug" == key || "js_dev_mode_debug" == key || "start_sampling_profiler_on_init" == key || "js_minify_debug" == key)) {
      listener.onInternalSettingsChanged()
    }
  }

  override var isElementInspectorEnabled: Boolean
    get() = mPreferences.getBoolean("inspector_debug", false)
    set(enabled) {
      mPreferences.edit().putBoolean("inspector_debug", enabled).apply()
    }

  override var isDeviceDebugEnabled: Boolean = ReactBuildConfig.DEBUG

  override var isRemoteJSDebugEnabled: Boolean
    get() = mPreferences.getBoolean("remote_js_debug", false)
    set(remoteJSDebugEnabled) {
      mPreferences.edit().putBoolean("remote_js_debug", remoteJSDebugEnabled).apply()
    }

  override var isStartSamplingProfilerOnInit: Boolean =
    mPreferences.getBoolean("start_sampling_profiler_on_init", false)

  override fun addMenuItem(title: String) {
  }

  override var isHotModuleReplacementEnabled: Boolean
    get() = mPreferences.getBoolean("hot_module_replacement", true)
    set(enabled) {
      mPreferences.edit().putBoolean("hot_module_replacement", enabled).apply()
    }

  fun interface Listener {
    fun onInternalSettingsChanged()
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
