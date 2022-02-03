package expo.modules.camera.events

import android.os.Bundle
import androidx.core.util.Pools

import expo.modules.camera.CameraViewManager
import expo.modules.core.interfaces.services.EventEmitter.BaseEvent

class FacesDetectedEvent private constructor() : BaseEvent() {
  private lateinit var faces: List<Bundle>
  private var viewTag = 0

  private fun init(viewTag: Int, faces: List<Bundle>) {
    this.viewTag = viewTag
    this.faces = faces
  }

  /**
   * note(@sjchmiela)
   * Should events about detected faces coalesce, the best strategy will be
   * to ensure that events with different faces count are always being transmitted.
   */
  override fun getCoalescingKey() =
    if (faces.size > Short.MAX_VALUE) Short.MAX_VALUE
    else faces.size.toShort()

  override fun getEventName() = CameraViewManager.Events.EVENT_ON_FACES_DETECTED.toString()

  override fun getEventBody() = Bundle().apply {
    putString("type", "face")
    putParcelableArray("faces", faces.toTypedArray())
    putInt("target", viewTag)
  }

  companion object {
    private val EVENTS_POOL = Pools.SynchronizedPool<FacesDetectedEvent>(3)
    fun obtain(viewTag: Int, faces: List<Bundle>): FacesDetectedEvent {
      var event = EVENTS_POOL.acquire()
      if (event == null) {
        event = FacesDetectedEvent()
      }
      event.init(viewTag, faces)
      return event
    }
  }
}
