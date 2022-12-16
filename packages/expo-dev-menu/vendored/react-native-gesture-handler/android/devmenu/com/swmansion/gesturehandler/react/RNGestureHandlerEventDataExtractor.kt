package devmenu.com.swmansion.gesturehandler.react

import com.facebook.react.bridge.WritableMap
import devmenu.com.swmansion.gesturehandler.GestureHandler

interface RNGestureHandlerEventDataExtractor<T : GestureHandler<T>> {
  fun extractEventData(handler: T, eventData: WritableMap)
}
