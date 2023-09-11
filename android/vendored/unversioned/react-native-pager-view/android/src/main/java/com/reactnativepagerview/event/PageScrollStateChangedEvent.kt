package com.reactnativepagerview.event

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter


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
