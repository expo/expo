package abi47_0_0.host.exp.exponent.modules.api.components.pagerview.event

import abi47_0_0.com.facebook.react.bridge.Arguments
import abi47_0_0.com.facebook.react.bridge.WritableMap
import abi47_0_0.com.facebook.react.uimanager.events.Event
import abi47_0_0.com.facebook.react.uimanager.events.RCTEventEmitter

/**
 * Event emitted by [ReactViewPager] when user scrolling state changed.
 *
 * Additional data provided by this event:
 * - pageScrollState - {Idle,Dragging,Settling}
 */
class PageScrollStateChangedEvent(viewTag: Int, private val mPageScrollState: String) : Event<PageScrollStateChangedEvent>(viewTag) {
  override fun getEventName(): String {
    return EVENT_NAME
  }

  override fun dispatch(rctEventEmitter: RCTEventEmitter) {
    rctEventEmitter.receiveEvent(viewTag, eventName, serializeEventData())
  }

  private fun serializeEventData(): WritableMap {
    val eventData = Arguments.createMap()
    eventData.putString("pageScrollState", mPageScrollState)
    return eventData
  }

  companion object {
    const val EVENT_NAME = "topPageScrollStateChanged"
  }
}
