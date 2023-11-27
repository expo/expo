package com.swmansion.gesturehandler.react.eventbuilders

import com.facebook.react.bridge.WritableMap
import com.swmansion.gesturehandler.core.GestureHandler

abstract class GestureHandlerEventDataBuilder<T : GestureHandler<T>>(handler: T) {
  private val numberOfPointers: Int
  private val handlerTag: Int
  private val state: Int

  init {
    numberOfPointers = handler.numberOfPointers
    handlerTag = handler.tag
    state = handler.state
  }

  open fun buildEventData(eventData: WritableMap) {
    eventData.putInt("numberOfPointers", numberOfPointers)
    eventData.putInt("handlerTag", handlerTag)
    eventData.putInt("state", state)
  }
}
