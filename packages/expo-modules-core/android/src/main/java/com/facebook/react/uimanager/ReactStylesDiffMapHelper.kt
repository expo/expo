package com.facebook.react.uimanager

import com.facebook.react.bridge.ReadableMap

/**
 * Access the package private property declared inside of [ReactStylesDiffMap]
 */
fun ReactStylesDiffMap.getBackingMap(): ReadableMap {
  return mBackingMap
}
