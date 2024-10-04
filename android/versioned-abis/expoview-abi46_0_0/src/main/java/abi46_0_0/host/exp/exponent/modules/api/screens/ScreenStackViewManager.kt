package abi46_0_0.host.exp.exponent.modules.api.screens

import android.view.View
import android.view.ViewGroup
import abi46_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi46_0_0.com.facebook.react.module.annotations.ReactModule
import abi46_0_0.com.facebook.react.uimanager.LayoutShadowNode
import abi46_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi46_0_0.com.facebook.react.uimanager.ViewGroupManager
import abi46_0_0.com.facebook.react.uimanager.ViewManagerDelegate
import abi46_0_0.com.facebook.react.viewmanagers.RNSScreenStackManagerDelegate
import abi46_0_0.com.facebook.react.viewmanagers.RNSScreenStackManagerInterface

@ReactModule(name = ScreenStackViewManager.REACT_CLASS)
class ScreenStackViewManager : ViewGroupManager<ScreenStack>(), RNSScreenStackManagerInterface<ScreenStack> {
  private val mDelegate: ViewManagerDelegate<ScreenStack>

  init {
    mDelegate = RNSScreenStackManagerDelegate<ScreenStack, ScreenStackViewManager>(this)
  }

  override fun getName(): String {
    return REACT_CLASS
  }

  override fun createViewInstance(reactContext: ThemedReactContext): ScreenStack {
    return ScreenStack(reactContext)
  }

  override fun addView(parent: ScreenStack, child: View, index: Int) {
    require(child is Screen) { "Attempt attach child that is not of type RNScreen" }
    parent.addScreen(child, index)
  }

  override fun removeViewAt(parent: ScreenStack, index: Int) {
    prepareOutTransition(parent.getScreenAt(index))
    parent.removeScreenAt(index)
  }

  private fun prepareOutTransition(screen: Screen?) {
    startTransitionRecursive(screen)
  }

  private fun startTransitionRecursive(parent: ViewGroup?) {
    var i = 0
    parent?.let {
      val size = it.childCount
      while (i < size) {
        val child = it.getChildAt(i)
        child?.let { view -> it.startViewTransition(view) }
        if (child is ScreenStackHeaderConfig) {
          // we want to start transition on children of the toolbar too,
          // which is not a child of ScreenStackHeaderConfig
          startTransitionRecursive(child.toolbar)
        }
        if (child is ViewGroup) {
          startTransitionRecursive(child)
        }
        i++
      }
    }
  }

  override fun getChildCount(parent: ScreenStack): Int {
    return parent.screenCount
  }

  override fun getChildAt(parent: ScreenStack, index: Int): View {
    return parent.getScreenAt(index)
  }

  override fun createShadowNodeInstance(context: ReactApplicationContext): LayoutShadowNode {
    return ScreensShadowNode(context)
  }

  override fun needsCustomLayoutForChildren(): Boolean {
    return true
  }

  protected override fun getDelegate(): ViewManagerDelegate<ScreenStack> {
    return mDelegate
  }

  companion object {
    const val REACT_CLASS = "RNSScreenStack"
  }
}
