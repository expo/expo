package versioned.host.exp.exponent.modules.api.screens

import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager

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
      "searchBar" -> ScreenStackHeaderSubview.Type.SEARCH_BAR
      else -> throw JSApplicationIllegalArgumentException("Unknown type $type")
    }
  }

  companion object {
    const val REACT_CLASS = "RNSScreenStackHeaderSubview"
  }
}
