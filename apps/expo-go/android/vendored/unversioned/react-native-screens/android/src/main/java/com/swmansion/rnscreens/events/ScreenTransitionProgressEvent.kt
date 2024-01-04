package com.swmansion.rnscreens.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class ScreenTransitionProgressEvent(
    surfaceId: Int,
    viewId: Int,
    private val mProgress: Float,
    private val mClosing: Boolean,
    private val mGoingForward: Boolean,
    private val mCoalescingKey: Short
) : Event<ScreenAppearEvent?>(surfaceId, viewId) {
    override fun getEventName(): String {
        return EVENT_NAME
    }

    override fun getCoalescingKey(): Short {
        return mCoalescingKey
    }

    override fun getEventData(): WritableMap? = Arguments.createMap().apply {
        putDouble("progress", mProgress.toDouble())
        putInt("closing", if (mClosing) 1 else 0)
        putInt("goingForward", if (mGoingForward) 1 else 0)
    }

    companion object {
        const val EVENT_NAME = "topTransitionProgress"
    }
}
