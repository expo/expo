package expo.modules.image.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class ImageLoadStartEvent(viewId: Int) : Event<ImageLoadStartEvent>(viewId) {
  override fun getEventName() = EVENT_NAME

  override fun dispatch(rctEventEmitter: RCTEventEmitter) {
    rctEventEmitter.receiveEvent(viewTag, eventName, Arguments.createMap())
  }

  companion object {
    const val EVENT_NAME = "onLoadStart"
  }
}
