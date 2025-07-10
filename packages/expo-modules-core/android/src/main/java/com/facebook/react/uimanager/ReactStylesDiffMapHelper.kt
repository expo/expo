package com.facebook.react.uimanager

import com.facebook.react.bridge.ReadableMap
import expo.modules.core.interfaces.DoNotStrip
import java.lang.reflect.Field

@get:DoNotStrip
private val backingMapField: Field by lazy {
  ReactStylesDiffMap::class.java.getDeclaredField("backingMap").apply {
    isAccessible = true
  }
}

/**
 * Access the package private property declared inside of [ReactStylesDiffMap]
 * TODO: We should stop using this field and find a better way to access the backing map:
 * See: https://github.com/facebook/react-native/pull/51386
 */
fun ReactStylesDiffMap.getBackingMap(): ReadableMap {
  return try {
    backingMapField.get(this) as ReadableMap
  } catch (e: ReflectiveOperationException) {
    throw RuntimeException("Unable to access internal_backingMap via reflection", e)
  }
}
