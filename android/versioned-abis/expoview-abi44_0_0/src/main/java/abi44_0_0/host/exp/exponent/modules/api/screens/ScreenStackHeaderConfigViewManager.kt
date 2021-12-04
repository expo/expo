package abi44_0_0.host.exp.exponent.modules.api.screens

import android.view.View
import abi44_0_0.com.facebook.react.bridge.JSApplicationCausedNativeException
import abi44_0_0.com.facebook.react.module.annotations.ReactModule
import abi44_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi44_0_0.com.facebook.react.uimanager.ViewGroupManager
import abi44_0_0.com.facebook.react.uimanager.annotations.ReactProp
import javax.annotation.Nonnull

@ReactModule(name = ScreenStackHeaderConfigViewManager.REACT_CLASS)
class ScreenStackHeaderConfigViewManager : ViewGroupManager<ScreenStackHeaderConfig>() {
  override fun getName(): String {
    return REACT_CLASS
  }

  override fun createViewInstance(reactContext: ThemedReactContext): ScreenStackHeaderConfig {
    return ScreenStackHeaderConfig(reactContext)
  }

  override fun addView(parent: ScreenStackHeaderConfig, child: View, index: Int) {
    if (child !is ScreenStackHeaderSubview) {
      throw JSApplicationCausedNativeException(
        "Config children should be of type " + ScreenStackHeaderSubviewManager.REACT_CLASS
      )
    }
    parent.addConfigSubview(child, index)
  }

  override fun onDropViewInstance(@Nonnull view: ScreenStackHeaderConfig) {
    view.destroy()
  }

  override fun removeAllViews(parent: ScreenStackHeaderConfig) {
    parent.removeAllConfigSubviews()
  }

  override fun removeViewAt(parent: ScreenStackHeaderConfig, index: Int) {
    parent.removeConfigSubview(index)
  }

  override fun getChildCount(parent: ScreenStackHeaderConfig): Int {
    return parent.configSubviewsCount
  }

  override fun getChildAt(parent: ScreenStackHeaderConfig, index: Int): View {
    return parent.getConfigSubview(index)
  }

  override fun needsCustomLayoutForChildren(): Boolean {
    return true
  }

  override fun onAfterUpdateTransaction(parent: ScreenStackHeaderConfig) {
    super.onAfterUpdateTransaction(parent)
    parent.onUpdate()
  }

  @ReactProp(name = "title")
  fun setTitle(config: ScreenStackHeaderConfig, title: String?) {
    config.setTitle(title)
  }

  @ReactProp(name = "titleFontFamily")
  fun setTitleFontFamily(config: ScreenStackHeaderConfig, titleFontFamily: String?) {
    config.setTitleFontFamily(titleFontFamily)
  }

  @ReactProp(name = "titleFontSize")
  fun setTitleFontSize(config: ScreenStackHeaderConfig, titleFontSize: Float) {
    config.setTitleFontSize(titleFontSize)
  }

  @ReactProp(name = "titleFontWeight")
  fun setTitleFontWeight(config: ScreenStackHeaderConfig, titleFontWeight: String?) {
    config.setTitleFontWeight(titleFontWeight)
  }

  @ReactProp(name = "titleColor", customType = "Color")
  fun setTitleColor(config: ScreenStackHeaderConfig, titleColor: Int) {
    config.setTitleColor(titleColor)
  }

  @ReactProp(name = "backgroundColor", customType = "Color")
  fun setBackgroundColor(config: ScreenStackHeaderConfig, backgroundColor: Int?) {
    config.setBackgroundColor(backgroundColor)
  }

  @ReactProp(name = "hideShadow")
  fun setHideShadow(config: ScreenStackHeaderConfig, hideShadow: Boolean) {
    config.setHideShadow(hideShadow)
  }

  @ReactProp(name = "hideBackButton")
  fun setHideBackButton(config: ScreenStackHeaderConfig, hideBackButton: Boolean) {
    config.setHideBackButton(hideBackButton)
  }

  @ReactProp(name = "topInsetEnabled")
  fun setTopInsetEnabled(config: ScreenStackHeaderConfig, topInsetEnabled: Boolean) {
    config.setTopInsetEnabled(topInsetEnabled)
  }

  @ReactProp(name = "color", customType = "Color")
  fun setColor(config: ScreenStackHeaderConfig, color: Int) {
    config.setTintColor(color)
  }

  @ReactProp(name = "hidden")
  fun setHidden(config: ScreenStackHeaderConfig, hidden: Boolean) {
    config.setHidden(hidden)
  }

  @ReactProp(name = "translucent")
  fun setTranslucent(config: ScreenStackHeaderConfig, translucent: Boolean) {
    config.setTranslucent(translucent)
  }

  @ReactProp(name = "backButtonInCustomView")
  fun setBackButtonInCustomView(
    config: ScreenStackHeaderConfig,
    backButtonInCustomView: Boolean
  ) {
    config.setBackButtonInCustomView(backButtonInCustomView)
  }

  @ReactProp(name = "direction")
  fun setDirection(config: ScreenStackHeaderConfig, direction: String?) {
    config.setDirection(direction)
  }

  companion object {
    const val REACT_CLASS = "RNSScreenStackHeaderConfig"
  }
}
