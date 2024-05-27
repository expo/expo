package com.reactnativecommunity.webview.events

import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

/**
 * Event emitted when the WebView opens a new Window (i.e: target=_blank)
 */
class TopOpenWindowEvent(viewId: Int, private val mEventData: WritableMap) :
  Event<TopOpenWindowEvent>(viewId) {
  companion object {
    const val EVENT_NAME = "topOpenWindow"
  }

  override fun getEventName(): String = EVENT_NAME

  override fun canCoalesce(): Boolean = false

  override fun getCoalescingKey(): Short = 0

  override fun dispatch(rctEventEmitter: RCTEventEmitter) =
    rctEventEmitter.receiveEvent(viewTag, eventName, mEventData)

}
