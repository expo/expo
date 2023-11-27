package com.swmansion.gesturehandler.react.eventbuilders

import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.PixelUtil
import com.swmansion.gesturehandler.core.PinchGestureHandler

class PinchGestureHandlerEventDataBuilder(handler: PinchGestureHandler) : GestureHandlerEventDataBuilder<PinchGestureHandler>(handler) {
  private val scale: Double
  private val focalX: Float
  private val focalY: Float
  private val velocity: Double

  init {
    scale = handler.scale
    focalX = handler.focalPointX
    focalY = handler.focalPointY
    velocity = handler.velocity
  }

  override fun buildEventData(eventData: WritableMap) {
    super.buildEventData(eventData)

    with(eventData) {
      putDouble("scale", scale)
      putDouble("focalX", PixelUtil.toDIPFromPixel(focalX).toDouble())
      putDouble("focalY", PixelUtil.toDIPFromPixel(focalY).toDouble())
      putDouble("velocity", velocity)
    }
  }
}
