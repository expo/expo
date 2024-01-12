package com.airbnb.android.react.lottie

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class OnAnimationFinishEvent
constructor(surfaceId: Int, viewId: Int, private val isCancelled: Boolean) :
    Event<OnAnimationFinishEvent>(surfaceId, viewId) {

    override fun getEventName(): String {
        return EVENT_NAME
    }

    override fun getCoalescingKey(): Short = 0

    override fun getEventData(): WritableMap? {
        val event = Arguments.createMap()
        event.putBoolean("isCancelled", isCancelled)
        return event
    }

    companion object {
        const val EVENT_NAME = "topAnimationFinish"
    }
}