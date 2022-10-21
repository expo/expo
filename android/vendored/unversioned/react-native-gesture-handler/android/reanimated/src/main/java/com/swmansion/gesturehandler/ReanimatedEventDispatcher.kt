package com.swmansion.gesturehandler

import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.events.Event
import com.swmansion.reanimated.ReanimatedModule

class ReanimatedEventDispatcher {
  private var reanimatedModule: ReanimatedModule? = null

  fun <T : Event<T>>sendEvent(event: T, reactApplicationContext: ReactContext) {
    if (reanimatedModule == null) {
      reanimatedModule = reactApplicationContext.getNativeModule(ReanimatedModule::class.java)
    }

    reanimatedModule?.nodesManager?.onEventDispatch(event)
  }
}
