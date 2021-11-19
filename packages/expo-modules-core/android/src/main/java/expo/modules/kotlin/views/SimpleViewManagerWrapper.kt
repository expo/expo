package expo.modules.kotlin.views

import android.view.View
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class SimpleViewManagerWrapper(
  override val viewWrapperDelegate: ViewManagerWrapperDelegate
) : SimpleViewManager<View>(), ViewWrapperDelegateHolder {
  override fun getName(): String = "ViewManagerAdapter_${viewWrapperDelegate.name}"

  override fun createViewInstance(reactContext: ThemedReactContext): View =
    viewWrapperDelegate.createView(reactContext)

  @ReactProp(name = "proxiedProperties")
  fun setProxiedProperties(view: View, proxiedProperties: ReadableMap) {
    viewWrapperDelegate.setProxiedProperties(view, proxiedProperties)
  }
}
