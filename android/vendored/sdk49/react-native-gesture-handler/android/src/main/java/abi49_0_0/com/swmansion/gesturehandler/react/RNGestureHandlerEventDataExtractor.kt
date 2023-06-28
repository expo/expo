package abi49_0_0.com.swmansion.gesturehandler.react

import abi49_0_0.com.facebook.react.bridge.WritableMap
import abi49_0_0.com.swmansion.gesturehandler.core.GestureHandler

interface RNGestureHandlerEventDataExtractor<T : GestureHandler<T>> {
  fun extractEventData(handler: T, eventData: WritableMap)
}
