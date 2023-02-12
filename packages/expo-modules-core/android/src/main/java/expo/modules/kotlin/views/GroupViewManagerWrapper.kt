package expo.modules.kotlin.views

import android.view.View
import android.view.ViewGroup
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp
import expo.modules.core.utilities.ifNull

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

  override fun addView(parent: ViewGroup, child: View, index: Int) {
    viewWrapperDelegate
      .viewGroupDefinition
      ?.addViewAction
      ?.invoke(parent, child, index)
      .ifNull {
        super.addView(parent, child, index)
      }
  }

  override fun getChildCount(parent: ViewGroup): Int {
    return viewWrapperDelegate.viewGroupDefinition
      ?.getChildCountAction
      ?.invoke(parent)
      .ifNull {
        super.getChildCount(parent)
      }
  }

  override fun getChildAt(parent: ViewGroup, index: Int): View? {
    viewWrapperDelegate.viewGroupDefinition
      ?.getChildAtAction
      ?.let {
        return it.invoke(parent, index)
      }
      .ifNull {
        return super.getChildAt(parent, index)
      }
  }

  override fun removeViewAt(parent: ViewGroup, index: Int) {
    viewWrapperDelegate.viewGroupDefinition
      ?.removeViewAtAction
      ?.invoke(parent, index)
      .ifNull {
        super.removeViewAt(parent, index)
      }
  }

  override fun removeView(parent: ViewGroup, view: View) {
    viewWrapperDelegate.viewGroupDefinition
      ?.removeViewAction
      ?.invoke(parent, view)
      .ifNull {
        super.removeView(parent, view)
      }
  }
}
