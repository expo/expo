package com.swmansion.gesturehandler.react.eventbuilders

import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.PixelUtil
import com.swmansion.gesturehandler.core.LongPressGestureHandler

class LongPressGestureHandlerEventDataBuilder(handler: LongPressGestureHandler) : GestureHandlerEventDataBuilder<LongPressGestureHandler>(handler) {
  private val x: Float
  private val y: Float
  private val absoluteX: Float
  private val absoluteY: Float
  private val duration: Int

  init {
    x = handler.lastRelativePositionX
    y = handler.lastRelativePositionY
    absoluteX = handler.lastPositionInWindowX
    absoluteY = handler.lastPositionInWindowY
    duration = handler.duration
  }

  override fun buildEventData(eventData: WritableMap) {
    super.buildEventData(eventData)

    with(eventData) {
      putDouble("x", PixelUtil.toDIPFromPixel(x).toDouble())
      putDouble("y", PixelUtil.toDIPFromPixel(y).toDouble())
      putDouble("absoluteX", PixelUtil.toDIPFromPixel(absoluteX).toDouble())
      putDouble("absoluteY", PixelUtil.toDIPFromPixel(absoluteY).toDouble())
      putInt("duration", duration)
    }
  }
}
