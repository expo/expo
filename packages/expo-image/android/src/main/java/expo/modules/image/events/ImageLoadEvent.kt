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
    val eventData = Arguments.createMap()
    eventData.putInt("cacheType", fromNativeValue(mDataSource).enumValue)
    eventData.putMap("source", serializeSource(mBitmapOptions, mModel))
    rctEventEmitter.receiveEvent(viewTag, eventName, eventData)
  }

  private fun serializeSource(options: BitmapFactory.Options, model: Any): ReadableMap {
    val data = Arguments.createMap()
    data.putString("url", model.toString())
    data.putInt("width", options.outWidth)
    data.putInt("height", options.outHeight)
    data.putString("mediaType", options.outMimeType)
    return data
  }

  companion object {
    const val EVENT_NAME = "onLoad"
  }
}