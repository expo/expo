package abi46_0_0.host.exp.exponent.modules.api.screens

import abi46_0_0.com.facebook.react.bridge.JSApplicationIllegalArgumentException
import abi46_0_0.com.facebook.react.module.annotations.ReactModule
import abi46_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi46_0_0.com.facebook.react.uimanager.ViewGroupManager
import abi46_0_0.com.facebook.react.uimanager.ViewManagerDelegate
import abi46_0_0.com.facebook.react.uimanager.annotations.ReactProp
import abi46_0_0.com.facebook.react.viewmanagers.RNSScreenStackHeaderSubviewManagerDelegate
import abi46_0_0.com.facebook.react.viewmanagers.RNSScreenStackHeaderSubviewManagerInterface

@ReactModule(name = ScreenStackHeaderSubviewManager.REACT_CLASS)
class ScreenStackHeaderSubviewManager : ViewGroupManager<ScreenStackHeaderSubview>(), RNSScreenStackHeaderSubviewManagerInterface<ScreenStackHeaderSubview> {
  private val mDelegate: ViewManagerDelegate<ScreenStackHeaderSubview>

  init {
    mDelegate = RNSScreenStackHeaderSubviewManagerDelegate<ScreenStackHeaderSubview, ScreenStackHeaderSubviewManager>(this)
  }

  override fun getName(): String {
    return REACT_CLASS
  }

  override fun createViewInstance(context: ThemedReactContext): ScreenStackHeaderSubview {
    return ScreenStackHeaderSubview(context)
  }

  @ReactProp(name = "type")
  override fun setType(view: ScreenStackHeaderSubview, type: String?) {
    view.type = when (type) {
      "left" -> ScreenStackHeaderSubview.Type.LEFT
      "center" -> ScreenStackHeaderSubview.Type.CENTER
      "right" -> ScreenStackHeaderSubview.Type.RIGHT
      "back" -> ScreenStackHeaderSubview.Type.BACK
      "searchBar" -> ScreenStackHeaderSubview.Type.SEARCH_BAR
      else -> throw JSApplicationIllegalArgumentException("Unknown type $type")
    }
  }

  protected override fun getDelegate(): ViewManagerDelegate<ScreenStackHeaderSubview> {
    return mDelegate
  }

  companion object {
    const val REACT_CLASS = "RNSScreenStackHeaderSubview"
  }
}
