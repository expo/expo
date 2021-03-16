/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package abi40_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk
import abi40_0_0.com.facebook.react.bridge.Arguments
import abi40_0_0.com.facebook.react.bridge.WritableMap
import abi40_0_0.com.facebook.react.uimanager.events.Event
import abi40_0_0.com.facebook.react.uimanager.events.RCTEventEmitter

internal class CardFocusEvent constructor(viewTag: Int, private val focusField: String?) : Event<CardFocusEvent>(viewTag) {
  override fun getEventName(): String {
    return EVENT_NAME
  }

  override fun dispatch(rctEventEmitter: RCTEventEmitter) {
    rctEventEmitter.receiveEvent(viewTag, eventName, serializeEventData())
  }

  private fun serializeEventData(): WritableMap {
    val eventData = Arguments.createMap()
    eventData.putString("focusedField", focusField)

    return eventData
  }

  companion object {
    const val EVENT_NAME = "onFocusChange"
  }

}
