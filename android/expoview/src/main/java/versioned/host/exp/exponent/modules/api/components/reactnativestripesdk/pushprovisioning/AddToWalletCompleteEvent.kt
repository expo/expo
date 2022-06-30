package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.pushprovisioning
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

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
