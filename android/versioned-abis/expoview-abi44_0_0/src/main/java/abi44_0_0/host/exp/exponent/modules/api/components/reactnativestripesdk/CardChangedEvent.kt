package abi44_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import abi44_0_0.com.facebook.react.bridge.Arguments
import abi44_0_0.com.facebook.react.bridge.WritableMap
import abi44_0_0.com.facebook.react.uimanager.events.Event
import abi44_0_0.com.facebook.react.uimanager.events.RCTEventEmitter

internal class CardChangedEvent constructor(viewTag: Int, private val cardDetails: MutableMap<String, Any?>, private val postalCodeEnabled: Boolean, private val complete: Boolean, private val dangerouslyGetFullCardDetails: Boolean) : Event<CardChangedEvent>(viewTag) {
  override fun getEventName(): String {
    return EVENT_NAME
  }

  override fun dispatch(rctEventEmitter: RCTEventEmitter) {
    rctEventEmitter.receiveEvent(viewTag, eventName, serializeEventData())
  }

  private fun getValOr(map: MutableMap<String, Any>, key: String, default: String? = null): String? {
    return if ((map[key] as CharSequence).isNotEmpty()) map[key] as String? else default
  }

  private fun serializeEventData(): WritableMap {
    val eventData = Arguments.createMap()
    eventData.putString("brand", cardDetails["brand"]?.toString())
    eventData.putString("last4", cardDetails["last4"]?.toString())

    (cardDetails["expiryMonth"] as Int?)?.let {
      eventData.putInt("expiryMonth", it)
    } ?: run {
      eventData.putNull("expiryMonth")
    }

    (cardDetails["expiryYear"] as Int?)?.let {
      eventData.putInt("expiryYear", it)
    } ?: run {
      eventData.putNull("expiryYear")
    }

    eventData.putBoolean("complete", complete)

    if (postalCodeEnabled) {
      eventData.putString("postalCode", cardDetails["postalCode"]?.toString())
    }

    if (dangerouslyGetFullCardDetails) {
      eventData.putString("number", cardDetails["number"]?.toString()?.replace(" ", ""))
    }

    return eventData
  }

  companion object {
    const val EVENT_NAME = "onCardChange"
  }
}
