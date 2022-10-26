package abi47_0_0.host.exp.exponent.modules.api.components.webview.events

import abi47_0_0.com.facebook.react.bridge.WritableMap
import abi47_0_0.com.facebook.react.uimanager.events.Event
import abi47_0_0.com.facebook.react.uimanager.events.RCTEventEmitter

/**
 * Event emitted when the WebView's process has crashed or
 was killed by the OS.
 */
class TopRenderProcessGoneEvent(viewId: Int, private val mEventData: WritableMap) :
  Event<TopRenderProcessGoneEvent>(viewId) {
  companion object {
    const val EVENT_NAME = "topRenderProcessGone"
  }

  override fun getEventName(): String = EVENT_NAME

  override fun canCoalesce(): Boolean = false

  override fun getCoalescingKey(): Short = 0

  override fun dispatch(rctEventEmitter: RCTEventEmitter) =
    rctEventEmitter.receiveEvent(viewTag, eventName, mEventData)
}
