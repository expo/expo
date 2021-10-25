package expo.modules.camera.events

import android.os.Bundle
import androidx.core.util.Pools

import expo.modules.camera.CameraViewManager
import expo.modules.core.interfaces.services.EventEmitter.BaseEvent

class PictureSavedEvent private constructor() : BaseEvent() {
  private lateinit var response: Bundle

  private fun init(response: Bundle) {
    this.response = response
  }

  override fun getCoalescingKey(): Short {
    val fallback: Short = -1
    val data = response
      .getBundle("data")
      ?.takeIf { it.containsKey("uri") }
      ?: return fallback
    val uri = data.getString("uri") ?: return fallback
    return (uri.hashCode() % Short.MAX_VALUE).toShort()
  }

  override fun getEventName() = CameraViewManager.Events.EVENT_ON_PICTURE_SAVED.toString()

  override fun getEventBody() = response

  companion object {
    private val EVENTS_POOL = Pools.SynchronizedPool<PictureSavedEvent>(3)
    fun obtain(response: Bundle): PictureSavedEvent {
      var event = EVENTS_POOL.acquire()
      if (event == null) {
        event = PictureSavedEvent()
      }
      event.init(response)
      return event
    }
  }
}
