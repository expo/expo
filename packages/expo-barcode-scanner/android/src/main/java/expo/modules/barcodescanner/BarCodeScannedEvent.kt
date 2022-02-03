package expo.modules.barcodescanner

import expo.modules.core.interfaces.services.EventEmitter.BaseEvent
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult
import androidx.core.util.Pools
import expo.modules.barcodescanner.utils.BarCodeScannerResultSerializer

class BarCodeScannedEvent(
  private var viewTag: Int,
  private var barCode: BarCodeScannerResult,
  private var density: Float
) : BaseEvent() {
  /**
   * We want every distinct barcode to be reported to the JS listener.
   * If we return some static value as a coalescing key there may be two barcode events
   * containing two different barcodes waiting to be transmitted to JS
   * that would get coalesced (because both of them would have the same coalescing key).
   * So let's differentiate them with a hash of the contents (mod short's max value).
   */
  override fun getCoalescingKey() =
    (barCode.value.hashCode() % Short.MAX_VALUE).toShort()

  override fun getEventName() =
    BarCodeScannerViewManager.Events.EVENT_ON_BAR_CODE_SCANNED.toString()

  override fun getEventBody() =
    BarCodeScannerResultSerializer.toBundle(barCode, density).apply {
      putInt("target", viewTag)
    }

  companion object {
    private val EVENTS_POOL = Pools.SynchronizedPool<BarCodeScannedEvent>(3)
    fun obtain(viewTag: Int, barCode: BarCodeScannerResult, density: Float): BarCodeScannedEvent {
      var event = EVENTS_POOL.acquire()
      if (event == null) {
        event = BarCodeScannedEvent(viewTag, barCode, density)
      }
      return event
    }
  }
}
