package expo.modules.camera.events

import android.os.Bundle
import androidx.core.util.Pools
import expo.modules.camera.CameraViewManager
import expo.modules.core.interfaces.services.EventEmitter.BaseEvent

class CameraReadyEvent private constructor() : BaseEvent() {
  override fun getEventName() = CameraViewManager.Events.EVENT_CAMERA_READY.toString()

  override fun getEventBody(): Bundle = Bundle.EMPTY

  companion object {
    private val EVENTS_POOL = Pools.SynchronizedPool<CameraReadyEvent>(3)
    fun obtain(): CameraReadyEvent {
      var event = EVENTS_POOL.acquire()
      if (event == null) {
        event = CameraReadyEvent()
      }
      return event
    }
  }
}
