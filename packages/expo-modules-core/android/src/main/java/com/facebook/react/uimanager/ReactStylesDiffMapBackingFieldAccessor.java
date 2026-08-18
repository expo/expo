package com.facebook.react.uimanager;

import com.facebook.react.bridge.ReadableMap;

/**
 * Access the package private property declared inside of [ReactStylesDiffMap]
 */
public class ReactStylesDiffMapBackingFieldAccessor {
  static ReadableMap getBackingMap(ReactStylesDiffMap diffMap) {
    return diffMap.internal_backingMap();
  }
}
