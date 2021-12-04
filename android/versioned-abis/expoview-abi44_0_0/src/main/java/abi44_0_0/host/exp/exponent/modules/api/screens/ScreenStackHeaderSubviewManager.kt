package abi44_0_0.host.exp.exponent.modules.api.screens

import abi44_0_0.com.facebook.react.bridge.JSApplicationIllegalArgumentException
import abi44_0_0.com.facebook.react.module.annotations.ReactModule
import abi44_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi44_0_0.com.facebook.react.uimanager.annotations.ReactProp
import abi44_0_0.com.facebook.react.views.view.ReactViewGroup
import abi44_0_0.com.facebook.react.views.view.ReactViewManager

@ReactModule(name = ScreenStackHeaderSubviewManager.REACT_CLASS)
class ScreenStackHeaderSubviewManager : ReactViewManager() {
  override fun getName(): String {
    return REACT_CLASS
  }

  override fun createViewInstance(context: ThemedReactContext): ReactViewGroup {
    return ScreenStackHeaderSubview(context)
  }

  @ReactProp(name = "type")
  fun setType(view: ScreenStackHeaderSubview, type: String) {
    view.type = when (type) {
      "left" -> ScreenStackHeaderSubview.Type.LEFT
      "center" -> ScreenStackHeaderSubview.Type.CENTER
      "right" -> ScreenStackHeaderSubview.Type.RIGHT
      "back" -> ScreenStackHeaderSubview.Type.BACK
      else -> throw JSApplicationIllegalArgumentException("Unknown type $type")
    }
  }

  companion object {
    const val REACT_CLASS = "RNSScreenStackHeaderSubview"
  }
}
