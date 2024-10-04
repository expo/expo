package abi46_0_0.host.exp.exponent.modules.api.screens.events

import abi46_0_0.com.facebook.react.bridge.Arguments
import abi46_0_0.com.facebook.react.uimanager.events.Event
import abi46_0_0.com.facebook.react.uimanager.events.RCTEventEmitter

class ScreenWillDisappearEvent(viewId: Int) : Event<ScreenWillDisappearEvent>(viewId) {
  override fun getEventName() = EVENT_NAME

  // All events for a given view can be coalesced.
  override fun getCoalescingKey(): Short = 0

  override fun dispatch(rctEventEmitter: RCTEventEmitter) {
    rctEventEmitter.receiveEvent(viewTag, eventName, Arguments.createMap())
  }

  companion object {
    const val EVENT_NAME = "topWillDisappear"
  }
}
