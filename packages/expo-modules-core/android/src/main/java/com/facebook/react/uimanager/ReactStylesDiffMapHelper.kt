package com.facebook.react.uimanager

import com.facebook.react.bridge.ReadableMap

fun ReactStylesDiffMap.getBackingMap(): ReadableMap {
  return ReactStylesDiffMapBackingFieldAccessor.getBackingMap(this)
}
