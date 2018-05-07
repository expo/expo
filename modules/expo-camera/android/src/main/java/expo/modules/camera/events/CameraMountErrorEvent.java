package expo.modules.camera.events;

import android.os.Bundle;
import android.support.v4.util.Pools;

import expo.core.interfaces.services.EventEmitter;
import expo.modules.camera.CameraViewManager;

public class CameraMountErrorEvent extends EventEmitter.BaseEvent {
  private static final Pools.SynchronizedPool<CameraMountErrorEvent> EVENTS_POOL = new Pools.SynchronizedPool<>(3);
  private String mMessage;
  private CameraMountErrorEvent() {}

  public static CameraMountErrorEvent obtain(String message) {
    CameraMountErrorEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new CameraMountErrorEvent();
    }
    event.init(message);
    return event;
  }

  private void init(String message) {
    mMessage = message;
  }

  @Override
  public String getEventName() {
    return CameraViewManager.Events.EVENT_ON_MOUNT_ERROR.toString();
  }

  @Override
  public Bundle getEventBody() {
    Bundle event = new Bundle();
    event.putString("message", mMessage);
    return event;
  }
}
