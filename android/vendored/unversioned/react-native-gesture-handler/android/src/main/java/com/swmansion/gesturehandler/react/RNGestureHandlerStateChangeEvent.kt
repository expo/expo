// 1. RCTEventEmitter was deprecated in favor of RCTModernEventEmitter interface
// 2. Event#init() with only viewTag was deprecated in favor of two arg c-tor
// 3. Event#receiveEvent() with 3 args was deprecated in favor of 4 args version
// ref: https://github.com/facebook/react-native/commit/2fbbdbb2ce897e8da3f471b08b93f167d566db1d
@file:Suppress("DEPRECATION")

package com.swmansion.gesturehandler.react

import androidx.core.util.Pools
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.swmansion.gesturehandler.core.GestureHandler
import com.swmansion.gesturehandler.react.eventbuilders.GestureHandlerEventDataBuilder

class RNGestureHandlerStateChangeEvent private constructor() : Event<RNGestureHandlerStateChangeEvent>() {
  private var dataBuilder: GestureHandlerEventDataBuilder<*>? = null
  private var newState: Int = GestureHandler.STATE_UNDETERMINED
  private var oldState: Int = GestureHandler.STATE_UNDETERMINED

  private fun <T : GestureHandler<T>> init(
    handler: T,
    newState: Int,
    oldState: Int,
    dataBuilder: GestureHandlerEventDataBuilder<T>,
  ) {
    super.init(handler.view!!.id)
    this.dataBuilder = dataBuilder
    this.newState = newState
    this.oldState = oldState
  }

  override fun onDispose() {
    dataBuilder = null
    newState = GestureHandler.STATE_UNDETERMINED
    oldState = GestureHandler.STATE_UNDETERMINED
    EVENTS_POOL.release(this)
  }

  override fun getEventName() = EVENT_NAME

  // TODO: coalescing
  override fun canCoalesce() = false

  // TODO: coalescing
  override fun getCoalescingKey(): Short = 0

  override fun dispatch(rctEventEmitter: RCTEventEmitter) {
    rctEventEmitter.receiveEvent(viewTag, EVENT_NAME, createEventData(dataBuilder!!, newState, oldState))
  }

  companion object {
    const val EVENT_NAME = "onGestureHandlerStateChange"
    private const val TOUCH_EVENTS_POOL_SIZE = 7 // magic
    private val EVENTS_POOL = Pools.SynchronizedPool<RNGestureHandlerStateChangeEvent>(TOUCH_EVENTS_POOL_SIZE)

    fun <T : GestureHandler<T>> obtain(
      handler: T,
      newState: Int,
      oldState: Int,
      dataBuilder: GestureHandlerEventDataBuilder<T>,
    ): RNGestureHandlerStateChangeEvent =
      (EVENTS_POOL.acquire() ?: RNGestureHandlerStateChangeEvent()).apply {
        init(handler, newState, oldState, dataBuilder)
      }

    fun createEventData(
      dataBuilder: GestureHandlerEventDataBuilder<*>,
      newState: Int,
      oldState: Int,
    ): WritableMap = Arguments.createMap().apply {
      dataBuilder.buildEventData(this)
      putInt("state", newState)
      putInt("oldState", oldState)
    }
  }
}
