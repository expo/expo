package com.swmansion.gesturehandler.react.eventbuilders

import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.PixelUtil
import com.swmansion.gesturehandler.core.PanGestureHandler

class PanGestureHandlerEventDataBuilder(handler: PanGestureHandler) : GestureHandlerEventDataBuilder<PanGestureHandler>(handler) {
  private val x: Float
  private val y: Float
  private val absoluteX: Float
  private val absoluteY: Float
  private val translationX: Float
  private val translationY: Float
  private val velocityX: Float
  private val velocityY: Float

  init {
    x = handler.lastRelativePositionX
    y = handler.lastRelativePositionY
    absoluteX = handler.lastPositionInWindowX
    absoluteY = handler.lastPositionInWindowY
    translationX = handler.translationX
    translationY = handler.translationY
    velocityX = handler.velocityX
    velocityY = handler.velocityY
  }

  override fun buildEventData(eventData: WritableMap) {
    super.buildEventData(eventData)

    with(eventData) {
      putDouble("x", PixelUtil.toDIPFromPixel(x).toDouble())
      putDouble("y", PixelUtil.toDIPFromPixel(y).toDouble())
      putDouble("absoluteX", PixelUtil.toDIPFromPixel(absoluteX).toDouble())
      putDouble("absoluteY", PixelUtil.toDIPFromPixel(absoluteY).toDouble())
      putDouble("translationX", PixelUtil.toDIPFromPixel(translationX).toDouble())
      putDouble("translationY", PixelUtil.toDIPFromPixel(translationY).toDouble())
      putDouble("velocityX", PixelUtil.toDIPFromPixel(velocityX).toDouble())
      putDouble("velocityY", PixelUtil.toDIPFromPixel(velocityY).toDouble())
    }
  }
}
