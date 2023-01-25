package com.reactnativepagerview.event

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter
import java.lang.Float.isInfinite
import java.lang.Float.isNaN


/**
 * Event emitted by [ReactViewPager] when user scrolls between pages (or when animating
 * between pages).
 *
 * Additional data provided by this event:
 * - position - index of first page from the left that is currently visible
 * - offset - value from range [0,1) describing stage between page transitions. Value x means that
 * (1 - x) fraction of the page at "position" index is visible, and x fraction of the next page
 * is visible.
 */
class PageScrollEvent(viewTag: Int, private val mPosition: Int, offset: Float) : Event<PageScrollEvent>(viewTag) {
    private val mOffset: Float = if (isInfinite(offset) || isNaN(offset)) 0.0f else offset
    override fun getEventName(): String {
        return EVENT_NAME
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
        rctEventEmitter.receiveEvent(viewTag, eventName, serializeEventData())
    }

    private fun serializeEventData(): WritableMap {
        val eventData = Arguments.createMap()
        eventData.putInt("position", mPosition)
        eventData.putDouble("offset", mOffset.toDouble())
        return eventData
    }

    companion object {
        const val EVENT_NAME = "topPageScroll"
    }

    init {

        // folly::toJson default options don't support serialize NaN or Infinite value
    }
}

