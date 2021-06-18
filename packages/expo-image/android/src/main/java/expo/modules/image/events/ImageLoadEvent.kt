package expo.modules.image.events

import android.graphics.BitmapFactory
import com.bumptech.glide.load.DataSource
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.RCTEventEmitter
import expo.modules.image.enums.ImageCacheType.Companion.fromNativeValue

class ImageLoadEvent(viewId: Int, private val mModel: Any, private val mDataSource: DataSource, private val mBitmapOptions: BitmapFactory.Options) : Event<ImageLoadEvent>(viewId) {
  override fun getEventName() = EVENT_NAME

  override fun dispatch(rctEventEmitter: RCTEventEmitter) {
    val eventData = Arguments.createMap().apply {
      putInt("cacheType", fromNativeValue(mDataSource).enumValue)
      putMap("source", serializeSource(mBitmapOptions, mModel))
    }
    rctEventEmitter.receiveEvent(viewTag, eventName, eventData)
  }

  private fun serializeSource(options: BitmapFactory.Options, model: Any): ReadableMap {
    return Arguments.createMap().apply {
      putString("url", model.toString())
      putInt("width", options.outWidth)
      putInt("height", options.outHeight)
      putString("mediaType", options.outMimeType)
    }
  }

  companion object {
    const val EVENT_NAME = "onLoad"
  }
}
