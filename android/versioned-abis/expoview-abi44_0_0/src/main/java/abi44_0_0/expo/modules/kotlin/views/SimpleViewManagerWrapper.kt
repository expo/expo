package abi44_0_0.expo.modules.kotlin.views

import android.view.View
import abi44_0_0.com.facebook.react.bridge.ReadableMap
import abi44_0_0.com.facebook.react.uimanager.SimpleViewManager
import abi44_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi44_0_0.com.facebook.react.uimanager.annotations.ReactProp

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
