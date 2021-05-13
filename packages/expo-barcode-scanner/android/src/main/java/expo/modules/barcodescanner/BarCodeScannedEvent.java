package expo.modules.barcodescanner;

import android.os.Bundle;

import org.unimodules.core.interfaces.services.EventEmitter;

import androidx.core.util.Pools;
import expo.modules.barcodescanner.utils.BarCodeScannerResultSerializer;
import expo.modules.interfaces.barcodescanner.BarCodeScannerResult;

public class BarCodeScannedEvent extends EventEmitter.BaseEvent {
  private static final Pools.SynchronizedPool<BarCodeScannedEvent> EVENTS_POOL =
      new Pools.SynchronizedPool<>(3);

  private BarCodeScannerResult mBarCode;
  private int mViewTag;
  private float mDensity;

  private BarCodeScannedEvent() {}

  public static BarCodeScannedEvent obtain(int viewTag, BarCodeScannerResult barCode, float density) {
    BarCodeScannedEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new BarCodeScannedEvent();
    }
    event.init(viewTag, barCode, density);
    return event;
  }

  private void init(int viewTag, BarCodeScannerResult barCode, float density) {
    mViewTag = viewTag;
    mBarCode = barCode;
    mDensity = density;
  }

  /**
   * We want every distinct barcode to be reported to the JS listener.
   * If we return some static value as a coalescing key there may be two barcode events
   * containing two different barcodes waiting to be transmitted to JS
   * that would get coalesced (because both of them would have the same coalescing key).
   * So let's differentiate them with a hash of the contents (mod short's max value).
   */
  @Override
  public short getCoalescingKey() {
    int hashCode = mBarCode.getValue().hashCode() % Short.MAX_VALUE;
    return (short) hashCode;
  }

  @Override
  public String getEventName() {
    return BarCodeScannerViewManager.Events.EVENT_ON_BAR_CODE_SCANNED.toString();
  }

  @Override
  public Bundle getEventBody() {
    Bundle event = BarCodeScannerResultSerializer.toBundle(mBarCode, mDensity);
    event.putInt("target", mViewTag);
    return event;
  }
}
