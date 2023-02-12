@file:Suppress("DEPRECATION")

package abi47_0_0.host.exp.exponent.modules.api.safeareacontext

import abi47_0_0.com.facebook.react.bridge.Arguments
import abi47_0_0.com.facebook.react.uimanager.events.Event
import abi47_0_0.com.facebook.react.uimanager.events.RCTEventEmitter

internal class InsetsChangeEvent(
  @Suppress("UNUSED_PARAMETER") surfaceId: Int,
  viewTag: Int,
  private val mInsets: EdgeInsets,
  private val mFrame: Rect
// New ctor is only available in RN 0.65.
) : Event<InsetsChangeEvent>(viewTag) {
  override fun getEventName() = EVENT_NAME

  // TODO: Migrate to getEventData when dropping support for RN 0.64.
  override fun dispatch(rctEventEmitter: RCTEventEmitter) {
    val event = Arguments.createMap()
    event.putMap("insets", edgeInsetsToJsMap(mInsets))
    event.putMap("frame", rectToJsMap(mFrame))
    rctEventEmitter.receiveEvent(viewTag, eventName, event)
  }

  companion object {
    const val EVENT_NAME = "topInsetsChange"
  }
}
