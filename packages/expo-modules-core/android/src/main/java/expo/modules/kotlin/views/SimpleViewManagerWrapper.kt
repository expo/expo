package expo.modules.kotlin.views

import android.view.View
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class SimpleViewManagerWrapper(
  private val wrapperDelegate: ViewManagerWrapperDelegate
) : SimpleViewManager<View>() {
  override fun getName(): String = "ViewManagerAdapter_${wrapperDelegate.name}"

  override fun createViewInstance(reactContext: ThemedReactContext): View =
    wrapperDelegate.createView(reactContext)

  @ReactProp(name = "proxiedProperties")
  fun setProxiedProperties(view: View, proxiedProperties: ReadableMap) {
    wrapperDelegate.setProxiedProperties(view, proxiedProperties)
  }
}
