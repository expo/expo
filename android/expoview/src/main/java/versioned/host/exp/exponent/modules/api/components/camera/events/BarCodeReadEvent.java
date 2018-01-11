package versioned.host.exp.exponent.modules.api.components.camera.events;

import android.support.v4.util.Pools;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.google.android.gms.vision.barcode.Barcode;

import versioned.host.exp.exponent.modules.api.components.camera.CameraViewManager;

public class BarCodeReadEvent extends Event<BarCodeReadEvent> {
  private static final Pools.SynchronizedPool<BarCodeReadEvent> EVENTS_POOL =
      new Pools.SynchronizedPool<>(3);

  private Barcode mBarCode;

  private BarCodeReadEvent() {}

  public static BarCodeReadEvent obtain(int viewTag, Barcode barCode) {
    BarCodeReadEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new BarCodeReadEvent();
    }
    event.init(viewTag, barCode);
    return event;
  }

  private void init(int viewTag, Barcode barCode) {
    super.init(viewTag);
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
    int hashCode = mBarCode.rawValue.hashCode() % Short.MAX_VALUE;
    return (short) hashCode;
  }

  @Override
  public String getEventName() {
    return CameraViewManager.Events.EVENT_ON_BAR_CODE_READ.toString();
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
  }

  private WritableMap serializeEventData() {
    WritableMap event = Arguments.createMap();

    event.putInt("target", getViewTag());
    event.putString("data", mBarCode.rawValue);
    event.putInt("type", mBarCode.format);

    return event;
  }
}
