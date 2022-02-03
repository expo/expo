package abi44_0_0.host.exp.exponent.modules.api.screens

import android.view.View
import abi44_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi44_0_0.com.facebook.react.module.annotations.ReactModule
import abi44_0_0.com.facebook.react.uimanager.LayoutShadowNode
import abi44_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi44_0_0.com.facebook.react.uimanager.ViewGroupManager

@ReactModule(name = ScreenContainerViewManager.REACT_CLASS)
class ScreenContainerViewManager : ViewGroupManager<ScreenContainer<*>>() {
  override fun getName(): String {
    return REACT_CLASS
  }

  override fun createViewInstance(reactContext: ThemedReactContext): ScreenContainer<ScreenFragment> {
    return ScreenContainer(reactContext)
  }

  override fun addView(parent: ScreenContainer<*>, child: View, index: Int) {
    require(child is Screen) { "Attempt attach child that is not of type RNScreens" }
    parent.addScreen(child, index)
  }

  override fun removeViewAt(parent: ScreenContainer<*>, index: Int) {
    parent.removeScreenAt(index)
  }

  override fun removeAllViews(parent: ScreenContainer<*>) {
    parent.removeAllScreens()
  }

  override fun getChildCount(parent: ScreenContainer<*>): Int {
    return parent.screenCount
  }

  override fun getChildAt(parent: ScreenContainer<*>, index: Int): View {
    return parent.getScreenAt(index)
  }

  override fun createShadowNodeInstance(context: ReactApplicationContext): LayoutShadowNode {
    return ScreensShadowNode(context)
  }

  override fun needsCustomLayoutForChildren(): Boolean {
    return true
  }

  companion object {
    const val REACT_CLASS = "RNSScreenContainer"
  }
}
