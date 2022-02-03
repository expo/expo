package abi44_0_0.host.exp.exponent.modules.api.components.gesturehandler.react

import abi44_0_0.com.facebook.react.bridge.WritableMap
import abi44_0_0.host.exp.exponent.modules.api.components.gesturehandler.GestureHandler

interface RNGestureHandlerEventDataExtractor<T : GestureHandler<T>> {
  fun extractEventData(handler: T, eventData: WritableMap)
}
