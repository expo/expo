package abi47_0_0.host.exp.exponent.modules.api.safeareacontext

import abi47_0_0.com.facebook.react.bridge.ReadableArray
import abi47_0_0.com.facebook.react.module.annotations.ReactModule
import abi47_0_0.com.facebook.react.uimanager.ReactStylesDiffMap
import abi47_0_0.com.facebook.react.uimanager.StateWrapper
import abi47_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi47_0_0.com.facebook.react.uimanager.ViewManagerDelegate
import abi47_0_0.com.facebook.react.uimanager.annotations.ReactProp
import abi47_0_0.com.facebook.react.views.view.ReactViewGroup
import abi47_0_0.com.facebook.react.views.view.ReactViewManager
import java.util.*

@ReactModule(name = SafeAreaViewManager.REACT_CLASS)
class SafeAreaViewManager : ReactViewManager(), RNCSafeAreaViewManagerInterface<SafeAreaView> {
  override fun getName() = REACT_CLASS

  // Make sure we're not using delegates for now since ReactViewGroupManager doesn't use one. If it
  // does in the future we will need a way to compose delegates together.
  override fun getDelegate(): ViewManagerDelegate<ReactViewGroup>? = null

  override fun createViewInstance(context: ThemedReactContext) = SafeAreaView(context)

  override fun createShadowNodeInstance() = SafeAreaViewShadowNode()

  override fun getShadowNodeClass() = SafeAreaViewShadowNode::class.java

  @ReactProp(name = "mode")
  override fun setMode(view: SafeAreaView, mode: String?) {
    when (mode) {
      "padding" -> {
        view.setMode(SafeAreaViewMode.PADDING)
      }
      "margin" -> {
        view.setMode(SafeAreaViewMode.MARGIN)
      }
    }
  }

  @ReactProp(name = "edges")
  override fun setEdges(view: SafeAreaView, propList: ReadableArray?) {
    val edges = EnumSet.noneOf(SafeAreaViewEdges::class.java)
    if (propList != null) {
      for (i in 0 until propList.size()) {
        when (propList.getString(i)) {
          "top" -> {
            edges.add(SafeAreaViewEdges.TOP)
          }
          "right" -> {
            edges.add(SafeAreaViewEdges.RIGHT)
          }
          "bottom" -> {
            edges.add(SafeAreaViewEdges.BOTTOM)
          }
          "left" -> {
            edges.add(SafeAreaViewEdges.LEFT)
          }
        }
      }
      view.setEdges(edges)
    }
  }

  override fun updateState(
    view: ReactViewGroup,
    props: ReactStylesDiffMap?,
    stateWrapper: StateWrapper?
  ): Any? {
    (view as SafeAreaView).fabricViewStateManager.setStateWrapper(stateWrapper)
    return null
  }

  companion object {
    const val REACT_CLASS = "RNCSafeAreaView"
  }
}
