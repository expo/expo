package abi47_0_0.com.swmansion.gesturehandler

import abi47_0_0.com.facebook.react.bridge.ReactContext
import abi47_0_0.com.facebook.react.uimanager.events.Event

class ReanimatedEventDispatcher {
  fun <T : Event<T>>sendEvent(event: T, reactApplicationContext: ReactContext) {
    // no-op
  }
}
