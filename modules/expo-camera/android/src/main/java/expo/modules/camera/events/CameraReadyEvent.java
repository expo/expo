package expo.modules.camera.events;

import android.os.Bundle;
import android.support.v4.util.Pools;

import expo.core.interfaces.services.EventEmitter;
import expo.modules.camera.CameraViewManager;

public class CameraReadyEvent extends EventEmitter.BaseEvent {
  private static final Pools.SynchronizedPool<CameraReadyEvent> EVENTS_POOL = new Pools.SynchronizedPool<>(3);
  private CameraReadyEvent() {}

  public static CameraReadyEvent obtain() {
    CameraReadyEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new CameraReadyEvent();
    }
    return event;
  }

  @Override
  public String getEventName() {
    return CameraViewManager.Events.EVENT_CAMERA_READY.toString();
  }

  @Override
  public Bundle getEventBody() {
    return Bundle.EMPTY;
  }
}
