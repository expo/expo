package abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.addresssheet

import abi49_0_0.com.facebook.react.bridge.WritableMap
import abi49_0_0.com.facebook.react.uimanager.events.Event
import abi49_0_0.com.facebook.react.uimanager.events.RCTEventEmitter

internal class AddressSheetEvent constructor(viewTag: Int, private val eventType: EventType, private val eventMap: WritableMap?) : Event<AddressSheetEvent>(viewTag) {
  enum class EventType {
    OnSubmit,
    OnError
  }

  override fun dispatch(rctEventEmitter: RCTEventEmitter) {
    rctEventEmitter.receiveEvent(viewTag, eventName, eventMap)
  }

  companion object {
    const val ON_SUBMIT = "onSubmitAction"
    const val ON_ERROR = "onErrorAction"
  }

  override fun getEventName(): String {
    return when (eventType) {
      EventType.OnSubmit -> ON_SUBMIT
      EventType.OnError -> ON_ERROR
    }
  }
}
