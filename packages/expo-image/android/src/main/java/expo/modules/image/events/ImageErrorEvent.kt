package expo.modules.image.events

import com.bumptech.glide.load.engine.GlideException
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter

class ImageErrorEvent(viewId: Int, private val mException: GlideException?) : Event<ImageErrorEvent>(viewId) {
  override fun getEventName() = EVENT_NAME

  override fun dispatch(rctEventEmitter: RCTEventEmitter) {
    val eventData = Arguments.createMap().apply {
      putString("error", mException.toString())
      putMap("android", serializeGlideException(mException))
    }
    rctEventEmitter.receiveEvent(viewTag, eventName, eventData)
  }

  private fun serializeThrowablesList(throwables: List<Throwable?>?): ReadableArray? {
    if (throwables == null) {
      return null
    }
    return Arguments.createArray().apply {
      throwables.map(::serializeThrowable).forEach(::pushMap)
    }
  }

  private fun serializeThrowable(throwable: Throwable?): ReadableMap? {
    if (throwable == null) {
      return null
    }
    return Arguments.createMap().apply {
      putString("class", throwable.javaClass.name)
      putMap("cause", serializeThrowable(throwable.cause))
      putString("message", throwable.localizedMessage)
    }
  }

  private fun serializeGlideException(exception: GlideException?): ReadableMap? {
    if (exception == null) {
      return null
    }
    val exceptionData = serializeThrowable(exception)
    return Arguments.createMap().apply {
      putMap("origin", serializeThrowable(exception.origin))
      putArray("causes", serializeThrowablesList(exception.causes))
      merge(exceptionData!!)
    }
  }

  companion object {
    const val EVENT_NAME = "onError"
  }
}
