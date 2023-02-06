package abi48_0_0.com.reactnativepagerview.event

import abi48_0_0.com.facebook.react.bridge.Arguments
import abi48_0_0.com.facebook.react.bridge.WritableMap
import abi48_0_0.com.facebook.react.uimanager.events.Event
import abi48_0_0.com.facebook.react.uimanager.events.RCTEventEmitter


/**
 * Event emitted by [ReactViewPager] when selected page changes.
 *
 * Additional data provided by this event:
 * - position - index of page that has been selected
 */
class PageSelectedEvent(viewTag: Int, private val mPosition: Int) : Event<PageSelectedEvent>(viewTag) {
    override fun getEventName(): String {
        return EVENT_NAME
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
        rctEventEmitter.receiveEvent(viewTag, eventName, serializeEventData())
    }

    private fun serializeEventData(): WritableMap {
        val eventData = Arguments.createMap()
        eventData.putInt("position", mPosition)
        return eventData
    }

    companion object {
        const val EVENT_NAME = "topPageSelected"
    }

}
