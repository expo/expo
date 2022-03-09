package expo.modules.kotlin.views

import android.view.View
import android.view.ViewGroup
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

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

  override fun onDropViewInstance(view: ViewGroup) {
    super.onDropViewInstance(view)
    viewWrapperDelegate.onDestroy(view)
  }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any>? {
    viewWrapperDelegate.getExportedCustomDirectEventTypeConstants()?.let {
      val directEvents = super.getExportedCustomDirectEventTypeConstants() ?: emptyMap()
      val builder = MapBuilder.builder<String, Any>()
      directEvents.forEach { event ->
        builder.put(event.key, event.value)
      }
      it.forEach { event ->
        builder.put(event.key, event.value)
      }
      return builder.build()
    }

    return super.getExportedCustomDirectEventTypeConstants()
  }

  override fun addView(parent: ViewGroup?, child: View?, index: Int) {
    viewWrapperDelegate.callGroupViewActionOrElse<Unit>(
      GroupViewAction.Action.ADD_VIEW,
      GroupViewAction.Payload(parent, child, index)
    ) {
      super.addView(parent, child, index)
    }
  }

  override fun getChildCount(parent: ViewGroup?): Int =
    viewWrapperDelegate.callGroupViewActionOrElse<Int>(
      GroupViewAction.Action.GET_CHILD_COUNT,
      GroupViewAction.Payload(parentView = parent)
    ) {
      super.getChildCount(parent)
    }

  override fun getChildAt(parent: ViewGroup?, index: Int): View =
    viewWrapperDelegate.callGroupViewActionOrElse<View>(
      GroupViewAction.Action.GET_CHILD_AT,
      GroupViewAction.Payload(parentView = parent, index = index)
    ) {
      super.getChildAt(parent, index)
    }

  override fun removeViewAt(parent: ViewGroup?, index: Int) {
    viewWrapperDelegate.callGroupViewActionOrElse<Unit>(
      GroupViewAction.Action.REMOVE_VIEW_AT,
      GroupViewAction.Payload(parentView = parent, index = index)
    ) {
      super.removeViewAt(parent, index)
    }
  }

  override fun removeView(parent: ViewGroup?, view: View?) {
    viewWrapperDelegate.callGroupViewActionOrElse<Unit>(
      GroupViewAction.Action.REMOVE_VIEW,
      GroupViewAction.Payload(parentView = parent, childView = view)
    ) {
      super.removeView(parent, view)
    }
  }
}
