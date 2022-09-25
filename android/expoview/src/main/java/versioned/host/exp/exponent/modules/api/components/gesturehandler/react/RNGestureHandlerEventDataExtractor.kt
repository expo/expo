package versioned.host.exp.exponent.modules.api.components.gesturehandler.react

import com.facebook.react.bridge.WritableMap
import versioned.host.exp.exponent.modules.api.components.gesturehandler.GestureHandler

interface RNGestureHandlerEventDataExtractor<T : GestureHandler<T>> {
  fun extractEventData(handler: T, eventData: WritableMap)
}
