package com.airbnb.android.react.lottie

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class OnAnimationLoadedEvent constructor(surfaceId: Int, viewId: Int) :
    Event<OnAnimationLoadedEvent>(surfaceId, viewId) {

    override fun getEventName(): String {
        return EVENT_NAME
    }

    override fun getEventData(): WritableMap? {
        return Arguments.createMap()
    }

    companion object {
        const val EVENT_NAME = "topAnimationLoadedEvent"
    }
}
