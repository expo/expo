package expo.modules.camera.events

import android.os.Bundle
import androidx.core.util.Pools

import expo.modules.camera.CameraViewManager
import expo.modules.core.interfaces.services.EventEmitter.BaseEvent
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult

class BarCodeScannedEvent private constructor() : BaseEvent() {
  private lateinit var barCode: BarCodeScannerResult
  private var viewTag = 0

  private fun init(viewTag: Int, barCode: BarCodeScannerResult) {
    this.viewTag = viewTag
    this.barCode = barCode
  }

  /**
   * We want every distinct barcode to be reported to the JS listener.
   * If we return some static value as a coalescing key there may be two barcode events
   * containing two different barcodes waiting to be transmitted to JS
   * that would get coalesced (because both of them would have the same coalescing key).
   * So let's differentiate them with a hash of the contents (mod short's max value).
   */
  override fun getCoalescingKey(): Short {
    val hashCode = barCode.value.hashCode() % Short.MAX_VALUE
    return hashCode.toShort()
  }

  override fun getEventName() = CameraViewManager.Events.EVENT_ON_BAR_CODE_SCANNED.toString()

  override fun getEventBody() = Bundle().apply {
    putInt("target", viewTag)
    putString("data", barCode.value)
    putInt("type", barCode.type)
  }

  companion object {
    private val EVENTS_POOL = Pools.SynchronizedPool<BarCodeScannedEvent>(3)
    fun obtain(viewTag: Int, barCode: BarCodeScannerResult): BarCodeScannedEvent {
      var event = EVENTS_POOL.acquire()
      if (event == null) {
        event = BarCodeScannedEvent()
      }
      event.init(viewTag, barCode)
      return event
    }
  }
}
