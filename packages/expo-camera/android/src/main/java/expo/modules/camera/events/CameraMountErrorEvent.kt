package expo.modules.camera.events

import androidx.core.util.Pools
import android.os.Bundle

import expo.modules.camera.CameraViewManager
import expo.modules.core.interfaces.services.EventEmitter.BaseEvent

class CameraMountErrorEvent private constructor() : BaseEvent() {
  private lateinit var message: String

  private fun init(message: String) {
    this.message = message
  }

  override fun getEventName() = CameraViewManager.Events.EVENT_ON_MOUNT_ERROR.toString()

  override fun getEventBody() = Bundle().apply {
    putString("message", message)
  }

  companion object {
    private val EVENTS_POOL = Pools.SynchronizedPool<CameraMountErrorEvent>(3)
    fun obtain(message: String): CameraMountErrorEvent {
      var event = EVENTS_POOL.acquire()
      if (event == null) {
        event = CameraMountErrorEvent()
      }
      event.init(message)
      return event
    }
  }
}
