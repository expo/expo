package devmenu.com.swmansion.gesturehandler.react

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager

/**
 * React native's view manager used for creating instances of []RNGestureHandlerRootView}. It
 * is being used by projects using react-native-navigation where for each screen new root view need
 * to be provided.
 */
@ReactModule(name = RNGestureHandlerRootViewManager.REACT_CLASS)
class RNGestureHandlerRootViewManager : ViewGroupManager<RNGestureHandlerRootView>() {
  override fun getName() = REACT_CLASS
  override fun createViewInstance(reactContext: ThemedReactContext) = RNGestureHandlerRootView(reactContext)

  override fun onDropViewInstance(view: RNGestureHandlerRootView) {
    view.tearDown()
  }

  /**
   * The following event configuration is necessary even if you are not using
   * GestureHandlerRootView component directly.
   */
  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Map<String, String>> = mutableMapOf(
    RNGestureHandlerEvent.EVENT_NAME to
      mutableMapOf("registrationName" to RNGestureHandlerEvent.EVENT_NAME),
    RNGestureHandlerStateChangeEvent.EVENT_NAME to
      mutableMapOf("registrationName" to RNGestureHandlerStateChangeEvent.EVENT_NAME))

  companion object {
    const val REACT_CLASS = "GestureHandlerRootView"
  }
}
