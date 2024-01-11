package com.swmansion.rnscreens.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class HeaderHeightChangeEvent(
    viewId: Int,
    private val mHeaderHeight: Double
) : Event<HeaderHeightChangeEvent>(viewId) {

    override fun getEventName() = EVENT_NAME

    // As the same header height could appear twice, use header height as a coalescing key.
    override fun getCoalescingKey(): Short = mHeaderHeight.toInt().toShort()

    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
        val map = Arguments.createMap()
        map.putDouble("headerHeight", mHeaderHeight)
        rctEventEmitter.receiveEvent(viewTag, eventName, map)
    }

    companion object {
        const val EVENT_NAME = "topHeaderHeightChange"
    }
}
