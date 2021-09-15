package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

internal class FormCompleteEvent constructor(viewTag: Int, private val formDetails: MutableMap<String, Any>) : Event<FormCompleteEvent>(viewTag) {
  override fun getEventName(): String {
    return EVENT_NAME
  }

  override fun dispatch(rctEventEmitter: RCTEventEmitter) {
    rctEventEmitter.receiveEvent(viewTag, eventName, serializeEventData())
  }

  private fun serializeEventData(): WritableMap {
    val eventData = Arguments.createMap()
    eventData.putString("accountNumber", formDetails["accountNumber"].toString())
    eventData.putString("bsbNumber", formDetails["bsbNumber"].toString())
    eventData.putString("email", formDetails["email"].toString())
    eventData.putString("name", formDetails["name"].toString())

    return eventData
  }

  companion object {
    const val EVENT_NAME = "onCompleteAction"
  }
}
