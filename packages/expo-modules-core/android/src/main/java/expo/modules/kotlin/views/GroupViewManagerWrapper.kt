package expo.modules.kotlin.views

import android.view.View
import android.view.ViewGroup
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

class GroupViewManagerWrapper(
  private val wrapperDelegate: ViewManagerWrapperDelegate
) : ViewGroupManager<ViewGroup>() {
  override fun getName(): String = "ViewManagerAdapter_${wrapperDelegate.name}"

  override fun createViewInstance(reactContext: ThemedReactContext): ViewGroup =
    wrapperDelegate.createView(reactContext) as ViewGroup

  @ReactProp(name = "proxiedProperties")
  fun setProxiedProperties(view: View, proxiedProperties: ReadableMap) {
    wrapperDelegate.setProxiedProperties(view, proxiedProperties)
  }
}
