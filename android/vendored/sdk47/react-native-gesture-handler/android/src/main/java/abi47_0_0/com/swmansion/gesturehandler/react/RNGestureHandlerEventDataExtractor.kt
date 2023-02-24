package abi47_0_0.com.swmansion.gesturehandler.react

import abi47_0_0.com.facebook.react.bridge.WritableMap
import abi47_0_0.com.swmansion.gesturehandler.core.GestureHandler

interface RNGestureHandlerEventDataExtractor<T : GestureHandler<T>> {
  fun extractEventData(handler: T, eventData: WritableMap)
}
