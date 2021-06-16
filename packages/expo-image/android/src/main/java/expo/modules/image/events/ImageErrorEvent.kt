package expo.modules.image.events

import com.bumptech.glide.load.engine.GlideException
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter
import java.util.*

class ImageErrorEvent(viewId: Int, private val mException: GlideException?) : Event<ImageErrorEvent>(viewId) {
  override fun getEventName(): String {
    return EVENT_NAME
  }

  override fun dispatch(rctEventEmitter: RCTEventEmitter) {
    val eventData = Arguments.createMap()
    eventData.putString("error", mException.toString())
    eventData.putMap("android", serializeGlideException(mException))
    rctEventEmitter.receiveEvent(viewTag, eventName, eventData)
  }

  fun serializeThrowablesList(throwables: List<Throwable?>?): ReadableArray? {
    if (throwables == null) {
      return null
    }
    val array = Arguments.createArray()
    for (throwable in throwables) {
      array.pushMap(serializeThrowable(throwable))
    }
    return array
  }

  private fun serializeThrowable(throwable: Throwable?): ReadableMap? {
    if (throwable == null) {
      return null
    }
    val data = Arguments.createMap()
    data.putString("class", throwable.javaClass.name)
    data.putMap("cause", serializeThrowable(throwable.cause))
    data.putString("message", throwable.localizedMessage)
    return data
  }

  private fun serializeGlideException(exception: GlideException?): ReadableMap? {
    if (exception == null) {
      return null
    }
    val exceptionData = serializeThrowable(exception)
    val data = Arguments.createMap()
    data.putMap("origin", serializeThrowable(exception.origin))
    data.putArray("causes", serializeThrowablesList(exception.causes))
    data.merge(Objects.requireNonNull(exceptionData)!!)
    return data
  }

  companion object {
    const val EVENT_NAME = "onError"
  }
}