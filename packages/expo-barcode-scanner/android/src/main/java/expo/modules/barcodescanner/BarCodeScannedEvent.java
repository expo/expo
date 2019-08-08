package expo.modules.barcodescanner;

import android.os.Bundle;
import android.support.v4.util.Pools;
import android.util.Pair;

import java.util.List;

import org.unimodules.core.interfaces.services.EventEmitter;
import org.unimodules.interfaces.barcodescanner.BarCodeScannerResult;
import expo.modules.barcodescanner.utils.BarCodeScannerEventHelper;

public class BarCodeScannedEvent extends EventEmitter.BaseEvent {
  private static final Pools.SynchronizedPool<BarCodeScannedEvent> EVENTS_POOL =
      new Pools.SynchronizedPool<>(3);

  private BarCodeScannerResult mBarCode;
  private int mViewTag;
  private List<Bundle> mCornerPoints;
  private Bundle mBoundingBox;

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
    Pair<List<Bundle>, Bundle> bundles = BarCodeScannerEventHelper.getCornerPointsAndBoundingBox(barCode.getCornerPoints(), density);
    mCornerPoints = bundles.first;
    mBoundingBox = bundles.second;
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
    Bundle event = new Bundle();
    event.putInt("target", mViewTag);
    event.putString("data", mBarCode.getValue());
    event.putInt("type", mBarCode.getType());
    if (!mCornerPoints.isEmpty()) {
      Bundle cornerPoints[] = new Bundle[mCornerPoints.size()];
      event.putParcelableArray("cornerPoints", mCornerPoints.toArray(cornerPoints));
      event.putBundle("bounds", mBoundingBox);
    }

    return event;
  }
}
