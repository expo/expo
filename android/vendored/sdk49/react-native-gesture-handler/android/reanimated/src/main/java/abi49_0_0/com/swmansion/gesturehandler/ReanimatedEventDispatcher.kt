package abi49_0_0.com.swmansion.gesturehandler

import abi49_0_0.com.facebook.react.bridge.ReactContext
import abi49_0_0.com.facebook.react.uimanager.events.Event
import abi49_0_0.com.swmansion.reanimated.ReanimatedModule

class ReanimatedEventDispatcher {
  private var reanimatedModule: ReanimatedModule? = null

  fun <T : Event<T>>sendEvent(event: T, reactApplicationContext: ReactContext) {
    if (reanimatedModule == null) {
      reanimatedModule = reactApplicationContext.getNativeModule(ReanimatedModule::class.java)
    }

    reanimatedModule?.nodesManager?.onEventDispatch(event)
  }
}
