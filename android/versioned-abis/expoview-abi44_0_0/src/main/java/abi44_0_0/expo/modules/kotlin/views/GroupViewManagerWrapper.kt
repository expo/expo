package abi44_0_0.expo.modules.kotlin.views

import android.view.View
import android.view.ViewGroup
import abi44_0_0.com.facebook.react.bridge.ReadableMap
import abi44_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi44_0_0.com.facebook.react.uimanager.ViewGroupManager
import abi44_0_0.com.facebook.react.uimanager.annotations.ReactProp

class GroupViewManagerWrapper(
  override val viewWrapperDelegate: ViewManagerWrapperDelegate
) : ViewGroupManager<ViewGroup>(), ViewWrapperDelegateHolder {
  override fun getName(): String = "ViewManagerAdapter_${viewWrapperDelegate.name}"

  override fun createViewInstance(reactContext: ThemedReactContext): ViewGroup =
    viewWrapperDelegate.createView(reactContext) as ViewGroup

  @ReactProp(name = "proxiedProperties")
  fun setProxiedProperties(view: View, proxiedProperties: ReadableMap) {
    viewWrapperDelegate.setProxiedProperties(view, proxiedProperties)
  }
}
