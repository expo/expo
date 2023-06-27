package abi49_0_0.host.exp.exponent.modules.api.components.webview.events

import abi49_0_0.com.facebook.react.bridge.WritableMap
import abi49_0_0.com.facebook.react.uimanager.events.Event
import abi49_0_0.com.facebook.react.uimanager.events.RCTEventEmitter

/**
 * Event emitted when a http error is received from the server.
 */
class TopHttpErrorEvent(viewId: Int, private val mEventData: WritableMap) :
  Event<TopHttpErrorEvent>(viewId) {
  companion object {
    const val EVENT_NAME = "topHttpError"
  }

  override fun getEventName(): String = EVENT_NAME

  override fun canCoalesce(): Boolean = false

  override fun getCoalescingKey(): Short = 0

  override fun dispatch(rctEventEmitter: RCTEventEmitter) =
    rctEventEmitter.receiveEvent(viewTag, eventName, mEventData)
}
