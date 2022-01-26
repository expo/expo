package expo.modules.kotlin.views

import android.view.View
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

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

  override fun onDropViewInstance(view: View) {
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
}
