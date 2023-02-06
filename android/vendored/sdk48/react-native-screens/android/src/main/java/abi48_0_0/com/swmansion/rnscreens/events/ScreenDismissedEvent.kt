package abi48_0_0.com.swmansion.rnscreens.events

import abi48_0_0.com.facebook.react.bridge.Arguments
import abi48_0_0.com.facebook.react.uimanager.events.Event
import abi48_0_0.com.facebook.react.uimanager.events.RCTEventEmitter

class ScreenDismissedEvent(viewId: Int) : Event<ScreenDismissedEvent>(viewId) {
    override fun getEventName() = EVENT_NAME

    // All events for a given view can be coalesced.
    override fun getCoalescingKey(): Short = 0

    override fun dispatch(rctEventEmitter: RCTEventEmitter) {
        val args = Arguments.createMap()
        // on Android we always dismiss one screen at a time
        args.putInt("dismissCount", 1)
        rctEventEmitter.receiveEvent(viewTag, eventName, args)
    }

    companion object {
        const val EVENT_NAME = "topDismissed"
    }
}
