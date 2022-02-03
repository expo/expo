package abi44_0_0.expo.modules.camera.events

import android.os.Bundle
import androidx.core.util.Pools

import abi44_0_0.expo.modules.core.interfaces.services.EventEmitter.BaseEvent
import abi44_0_0.expo.modules.interfaces.facedetector.FaceDetectorInterface
import abi44_0_0.expo.modules.camera.CameraViewManager

class FaceDetectionErrorEvent private constructor() : BaseEvent() {
  private var faceDetector: FaceDetectorInterface? = null

  private fun init(faceDetector: FaceDetectorInterface) {
    this.faceDetector = faceDetector
  }

  override fun getCoalescingKey(): Short = 0

  override fun getEventName() = CameraViewManager.Events.EVENT_ON_MOUNT_ERROR.toString()

  override fun getEventBody() = Bundle().apply {
    putBoolean("isOperational", isFaceDetectorOperational)
  }

  private val isFaceDetectorOperational: Boolean
    get() = faceDetector != null

  companion object {
    private val EVENTS_POOL = Pools.SynchronizedPool<FaceDetectionErrorEvent>(3)
    fun obtain(faceDetector: FaceDetectorInterface): FaceDetectionErrorEvent {
      var event = EVENTS_POOL.acquire()
      if (event == null) {
        event = FaceDetectionErrorEvent()
      }
      event.init(faceDetector)
      return event
    }
  }
}
