package abi49_0_0.com.swmansion.rnscreens.events

import abi49_0_0.com.facebook.react.bridge.Arguments
import abi49_0_0.com.facebook.react.uimanager.events.Event
import abi49_0_0.com.facebook.react.uimanager.events.RCTEventEmitter

class HeaderDetachedEvent(viewId: Int) : Event<ScreenAppearEvent>(viewId) {
    override fun getEventName(): String {
        return EVENT_NAME
    }

    override fun getCoalescingKey(): Short {
        // All events for a given view can be coalesced.
        return 0
    }

    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
        rctEventEmitter.receiveEvent(viewTag, eventName, Arguments.createMap())
    }

    companion object {
        const val EVENT_NAME = "topDetached"
    }
}
