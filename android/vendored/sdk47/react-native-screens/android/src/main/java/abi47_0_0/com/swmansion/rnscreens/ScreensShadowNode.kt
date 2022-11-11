package abi47_0_0.com.swmansion.rnscreens

import abi47_0_0.com.facebook.react.bridge.ReactContext
import abi47_0_0.com.facebook.react.uimanager.LayoutShadowNode
import abi47_0_0.com.facebook.react.uimanager.NativeViewHierarchyManager
import abi47_0_0.com.facebook.react.uimanager.NativeViewHierarchyOptimizer
import abi47_0_0.com.facebook.react.uimanager.UIManagerModule

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
