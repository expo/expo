package expo.modules.kotlin.views

import android.view.View
import android.view.ViewGroup
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.getBackingMap
import expo.modules.core.utilities.ifNull

class GroupViewManagerWrapper(
  override val viewWrapperDelegate: ViewManagerWrapperDelegate
) : ViewGroupManager<ViewGroup>(), ViewWrapperDelegateHolder {
  override fun getName(): String = "ViewManagerAdapter_${viewWrapperDelegate.name}"

  override fun createViewInstance(reactContext: ThemedReactContext): ViewGroup =
    viewWrapperDelegate.createView(reactContext) as ViewGroup

  override fun updateProperties(viewToUpdate: ViewGroup, props: ReactStylesDiffMap) {
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

  override fun onAfterUpdateTransaction(view: ViewGroup) {
    super.onAfterUpdateTransaction(view)
    viewWrapperDelegate.onViewDidUpdateProps(view)
  }

  override fun updateState(
    view: ViewGroup,
    props: ReactStylesDiffMap?,
    stateWrapper: StateWrapper?
  ): Any? {
    val view = view as? ExpoView ?: return null
    view.stateWrapper = stateWrapper
    return super.updateState(view, props, stateWrapper)
  }

  override fun getNativeProps(): MutableMap<String, String> {
    val props = super.getNativeProps()
    viewWrapperDelegate.props.forEach { (key, prop) ->
      props[key] = prop.type.kType.classifier.toString()
    }
    return props
  }

  override fun onDropViewInstance(view: ViewGroup) {
    super.onDropViewInstance(view)
    viewWrapperDelegate.onDestroy(view)
  }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any>? {
    val expoEvent = viewWrapperDelegate.getExportedCustomDirectEventTypeConstants() ?: emptyMap()
    return super.getExportedCustomDirectEventTypeConstants()?.plus(expoEvent) ?: expoEvent
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
