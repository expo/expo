package abi47_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.pushprovisioning
import abi47_0_0.com.facebook.react.bridge.WritableMap
import abi47_0_0.com.facebook.react.uimanager.events.Event
import abi47_0_0.com.facebook.react.uimanager.events.RCTEventEmitter

internal class AddToWalletCompleteEvent constructor(viewTag: Int, private val error: WritableMap?) : Event<AddToWalletCompleteEvent>(viewTag) {
  override fun getEventName(): String {
    return EVENT_NAME
  }

  override fun dispatch(rctEventEmitter: RCTEventEmitter) {
    rctEventEmitter.receiveEvent(viewTag, eventName, serializeEventData())
  }

  private fun serializeEventData(): WritableMap? {
    return error
  }

  companion object {
    const val EVENT_NAME = "onCompleteAction"
  }
}
