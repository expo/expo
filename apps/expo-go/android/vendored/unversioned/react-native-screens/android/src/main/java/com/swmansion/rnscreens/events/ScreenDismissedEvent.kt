package com.swmansion.rnscreens.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class ScreenDismissedEvent(surfaceId: Int, viewId: Int) : Event<ScreenDismissedEvent>(surfaceId, viewId) {
    override fun getEventName() = EVENT_NAME

    // All events for a given view can be coalesced.
    override fun getCoalescingKey(): Short = 0

    override fun getEventData(): WritableMap? = Arguments.createMap().apply {
        putInt("dismissCount", 1)
    }

    companion object {
        const val EVENT_NAME = "topDismissed"
    }
}
