package expo.modules.devmenu.react

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.devsupport.DevInternalSettings

/**
 * Class representing react's internal [DevInternalSettings] class, which we want to replace to change [packagerConnectionSettings] and others settings.
 * It is only use when [expo.modules.devmenu.DevMenuHost.getUseDeveloperSupport] returns true.
 */
class DevMenuReactInternalSettings(
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
