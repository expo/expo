package abi48_0_0.com.swmansion.gesturehandler.react

import abi48_0_0.com.facebook.react.bridge.WritableMap
import abi48_0_0.com.swmansion.gesturehandler.core.GestureHandler

interface RNGestureHandlerEventDataExtractor<T : GestureHandler<T>> {
  fun extractEventData(handler: T, eventData: WritableMap)
}
