package com.facebook.react.devsupport

import android.content.Context
import android.content.SharedPreferences
import android.content.SharedPreferences.OnSharedPreferenceChangeListener
import android.preference.PreferenceManager
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.devsupport.DevMenuSettingsBase.Listener
import com.facebook.react.modules.debug.interfaces.DeveloperSettings

/**
 * Implementation has been copied from reacts internal [DevInternalSettings] class
 */
abstract class DevMenuSettingsBase(
  context: Context,
  private val listener: Listener? = Listener {}
) : DeveloperSettings, OnSharedPreferenceChangeListener {
  protected val mPreferences: SharedPreferences = PreferenceManager.getDefaultSharedPreferences(context)

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
