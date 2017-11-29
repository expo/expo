package versioned.host.exp.exponent.modules.api.components.camera.events;

import android.support.v4.util.Pools;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import versioned.host.exp.exponent.modules.api.components.camera.CameraViewManager;

public class CameraReadyEvent extends Event<CameraReadyEvent> {
  private static final Pools.SynchronizedPool<CameraReadyEvent> EVENTS_POOL = new Pools.SynchronizedPool<>(3);
  private CameraReadyEvent() {}

  public static CameraReadyEvent obtain(int viewTag) {
    CameraReadyEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new CameraReadyEvent();
    }
    event.init(viewTag);
    return event;
  }

  @Override
  public short getCoalescingKey() {
    return 0;
  }

  @Override
  public String getEventName() {
    return CameraViewManager.Events.EVENT_CAMERA_READY.toString();
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
  }

  private WritableMap serializeEventData() {
    return Arguments.createMap();
  }
}
