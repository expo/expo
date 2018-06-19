package expo.modules.camera.events;

import android.os.Bundle;
import android.support.v4.util.Pools;

import com.google.android.gms.vision.barcode.Barcode;

import expo.core.interfaces.services.EventEmitter;
import expo.modules.camera.CameraViewManager;
import expo.modules.camera.utils.ExpoBarCodeDetector;

public class BarCodeReadEvent extends EventEmitter.BaseEvent {
  private static final Pools.SynchronizedPool<BarCodeReadEvent> EVENTS_POOL =
      new Pools.SynchronizedPool<>(3);

  private ExpoBarCodeDetector.Result mBarCode;
  private int mViewTag;

  private BarCodeReadEvent() {}

  public static BarCodeReadEvent obtain(int viewTag, ExpoBarCodeDetector.Result barCode) {
    BarCodeReadEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new BarCodeReadEvent();
    }
    event.init(viewTag, barCode);
    return event;
  }

  private void init(int viewTag, ExpoBarCodeDetector.Result barCode) {
    mViewTag = viewTag;
    mBarCode = barCode;
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
    return CameraViewManager.Events.EVENT_ON_BAR_CODE_READ.toString();
  }

  @Override
  public Bundle getEventBody() {
    Bundle event = new Bundle();
    event.putInt("target", mViewTag);
    event.putString("data", mBarCode.getValue());
    event.putInt("type", mBarCode.getType());
    return event;
  }
}
