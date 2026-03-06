package expo.modules.kotlin.views

import android.view.View
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.getBackingMap

class SimpleViewManagerWrapper(
  override val viewWrapperDelegate: ViewManagerWrapperDelegate
) : SimpleViewManager<View>(), ViewWrapperDelegateHolder {
  override fun getName(): String = viewWrapperDelegate.viewManagerName

  override fun createViewInstance(reactContext: ThemedReactContext): View =
    viewWrapperDelegate.createView(reactContext)

  override fun updateProperties(viewToUpdate: View, props: ReactStylesDiffMap) {
    val propsMap = props.getBackingMap()
    // Updates expo related properties.
    val handledProps = viewWrapperDelegate.updateProperties(viewToUpdate, propsMap)
    viewWrapperDelegate.updateStateProps(viewToUpdate)
    // Updates remaining props using RN implementation.
    // To not triggered undefined setters we filtrated already handled properties.
    super.updateProperties(
      viewToUpdate,
      ReactStylesDiffMap(FilteredReadableMap(propsMap, handledProps))
    )
  }

  override fun updateState(
    view: View,
    props: ReactStylesDiffMap?,
    stateWrapper: StateWrapper?
  ): Any? {
    (view as? ExpoView)?.stateWrapper = stateWrapper
    viewWrapperDelegate.updateStateProps(view)
    return null
  }

  override fun onAfterUpdateTransaction(view: View) {
    super.onAfterUpdateTransaction(view)
    viewWrapperDelegate.onViewDidUpdateProps(view)
  }

  override fun getNativeProps(): MutableMap<String, String> {
    val props = super.getNativeProps()
    viewWrapperDelegate.props.forEach { (key, prop) ->
      props[key] = prop.type.kType.classifier.toString()
    }
    return props
  }

  override fun onDropViewInstance(view: View) {
    super.onDropViewInstance(view)
    viewWrapperDelegate.onDestroy(view)
  }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> {
    val expoEvent = viewWrapperDelegate.getExportedCustomDirectEventTypeConstants()
    return super.getExportedCustomDirectEventTypeConstants()?.plus(expoEvent) ?: expoEvent
  }
}
