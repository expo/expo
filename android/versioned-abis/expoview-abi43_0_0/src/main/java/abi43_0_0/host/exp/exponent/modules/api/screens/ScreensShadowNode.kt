package abi43_0_0.host.exp.exponent.modules.api.screens

import abi43_0_0.com.facebook.react.bridge.ReactContext
import abi43_0_0.com.facebook.react.uimanager.LayoutShadowNode
import abi43_0_0.com.facebook.react.uimanager.NativeViewHierarchyManager
import abi43_0_0.com.facebook.react.uimanager.NativeViewHierarchyOptimizer
import abi43_0_0.com.facebook.react.uimanager.UIManagerModule

internal class ScreensShadowNode(private var mContext: ReactContext) : LayoutShadowNode() {
  override fun onBeforeLayout(nativeViewHierarchyOptimizer: NativeViewHierarchyOptimizer) {
    super.onBeforeLayout(nativeViewHierarchyOptimizer)
    (mContext.getNativeModule(UIManagerModule::class.java))?.addUIBlock { nativeViewHierarchyManager: NativeViewHierarchyManager ->
      val view = nativeViewHierarchyManager.resolveView(reactTag)
      if (view is ScreenContainer<*>) {
        view.performUpdates()
      }
    }
  }
}
