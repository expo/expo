package abi49_0_0.expo.modules.kotlin.views

import android.view.View
import abi49_0_0.com.facebook.react.common.MapBuilder
import abi49_0_0.com.facebook.react.uimanager.ReactStylesDiffMap
import abi49_0_0.com.facebook.react.uimanager.SimpleViewManager
import abi49_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi49_0_0.com.facebook.react.uimanager.getBackingMap

class SimpleViewManagerWrapper(
  override val viewWrapperDelegate: ViewManagerWrapperDelegate
) : SimpleViewManager<View>(), ViewWrapperDelegateHolder {
  override fun getName(): String = "ViewManagerAdapter_${viewWrapperDelegate.name}"

  override fun createViewInstance(reactContext: ThemedReactContext): View =
    viewWrapperDelegate.createView(reactContext)

  override fun updateProperties(viewToUpdate: View, props: ReactStylesDiffMap) {
    val propsMap = props.getBackingMap()
    // Updates expo related properties.
    val handledProps = viewWrapperDelegate.updateProperties(viewToUpdate, propsMap)
    // Updates remaining props using RN implementation.
    // To not triggered undefined setters we filtrated already handled properties.
    super.updateProperties(
      viewToUpdate,
      ReactStylesDiffMap(FilteredReadableMap(propsMap, handledProps))
    )
  }

  override fun onAfterUpdateTransaction(view: View) {
    super.onAfterUpdateTransaction(view)
    viewWrapperDelegate.onViewDidUpdateProps(view)
  }

  override fun getNativeProps(): MutableMap<String, String> {
    val props = super.getNativeProps()
    viewWrapperDelegate.props.forEach { (key, prop) ->
      props[key] = prop.type.kType.toString()
    }
    return props
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
