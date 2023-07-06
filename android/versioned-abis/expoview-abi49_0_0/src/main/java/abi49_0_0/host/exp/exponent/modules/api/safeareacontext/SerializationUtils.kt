package abi49_0_0.host.exp.exponent.modules.api.safeareacontext

import abi49_0_0.com.facebook.react.bridge.Arguments
import abi49_0_0.com.facebook.react.bridge.WritableMap
import abi49_0_0.com.facebook.react.uimanager.PixelUtil

fun edgeInsetsToJsMap(insets: EdgeInsets): WritableMap {
  val insetsMap = Arguments.createMap()
  insetsMap.putDouble("top", PixelUtil.toDIPFromPixel(insets.top).toDouble())
  insetsMap.putDouble("right", PixelUtil.toDIPFromPixel(insets.right).toDouble())
  insetsMap.putDouble("bottom", PixelUtil.toDIPFromPixel(insets.bottom).toDouble())
  insetsMap.putDouble("left", PixelUtil.toDIPFromPixel(insets.left).toDouble())
  return insetsMap
}

fun edgeInsetsToJavaMap(insets: EdgeInsets): Map<String, Float> {
  return mapOf(
    "top" to PixelUtil.toDIPFromPixel(insets.top),
    "right" to PixelUtil.toDIPFromPixel(insets.right),
    "bottom" to PixelUtil.toDIPFromPixel(insets.bottom),
    "left" to PixelUtil.toDIPFromPixel(insets.left)
  )
}

fun rectToJsMap(rect: Rect): WritableMap {
  val rectMap = Arguments.createMap()
  rectMap.putDouble("x", PixelUtil.toDIPFromPixel(rect.x).toDouble())
  rectMap.putDouble("y", PixelUtil.toDIPFromPixel(rect.y).toDouble())
  rectMap.putDouble("width", PixelUtil.toDIPFromPixel(rect.width).toDouble())
  rectMap.putDouble("height", PixelUtil.toDIPFromPixel(rect.height).toDouble())
  return rectMap
}

fun rectToJavaMap(rect: Rect): Map<String, Float> {
  return mapOf(
    "x" to PixelUtil.toDIPFromPixel(rect.x),
    "y" to PixelUtil.toDIPFromPixel(rect.y),
    "width" to PixelUtil.toDIPFromPixel(rect.width),
    "height" to PixelUtil.toDIPFromPixel(rect.height)
  )
}
