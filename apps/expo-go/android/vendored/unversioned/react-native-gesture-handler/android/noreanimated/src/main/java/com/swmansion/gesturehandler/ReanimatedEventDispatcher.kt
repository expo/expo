package com.swmansion.gesturehandler

import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.events.Event

class ReanimatedEventDispatcher {
  fun <T : Event<T>>sendEvent(event: T, reactApplicationContext: ReactContext) {
    // no-op
  }
}
