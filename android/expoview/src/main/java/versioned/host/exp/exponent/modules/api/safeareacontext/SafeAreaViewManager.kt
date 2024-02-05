package versioned.host.exp.exponent.modules.api.safeareacontext

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import versioned.host.exp.exponent.modules.api.safeareacontext.RNCSafeAreaViewManagerInterface
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager

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
  override fun setEdges(view: SafeAreaView, propList: ReadableMap?) {
    if (propList != null) {
      view.setEdges(
          SafeAreaViewEdges(
              top = propList.getString("top")?.let { SafeAreaViewEdgeModes.valueOf(it.uppercase()) }
                      ?: SafeAreaViewEdgeModes.OFF,
              right =
                  propList.getString("right")?.let { SafeAreaViewEdgeModes.valueOf(it.uppercase()) }
                      ?: SafeAreaViewEdgeModes.OFF,
              bottom =
                  propList.getString("bottom")?.let {
                    SafeAreaViewEdgeModes.valueOf(it.uppercase())
                  }
                      ?: SafeAreaViewEdgeModes.OFF,
              left =
                  propList.getString("left")?.let { SafeAreaViewEdgeModes.valueOf(it.uppercase()) }
                      ?: SafeAreaViewEdgeModes.OFF))
    }
  }

  override fun updateState(
      view: ReactViewGroup,
      props: ReactStylesDiffMap?,
      stateWrapper: StateWrapper?
  ): Any? {
    (view as SafeAreaView).setStateWrapper(stateWrapper)
    return null
  }

  companion object {
    const val REACT_CLASS = "RNCSafeAreaView"
  }
}
