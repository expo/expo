package expo.modules.camera.events;

import android.os.Bundle;
import androidx.core.util.Pools;

import org.unimodules.core.interfaces.services.EventEmitter;
import expo.modules.camera.CameraViewManager;

public class PictureSavedEvent extends EventEmitter.BaseEvent {
  private static final Pools.SynchronizedPool<PictureSavedEvent> EVENTS_POOL =
      new Pools.SynchronizedPool<>(3);

  private Bundle mResponse;

  private PictureSavedEvent() {}

  public static PictureSavedEvent obtain(Bundle response) {
    PictureSavedEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new PictureSavedEvent();
    }
    event.init(response);
    return event;
  }

  private void init(Bundle response) {
    mResponse = response;
  }

  @Override
  public short getCoalescingKey() {
    short fallback = -1;
    Bundle data = mResponse.getBundle("data");
    if (data == null || !data.containsKey("uri")) {
      return fallback;
    }
    String uri = data.getString("uri");
    if (uri == null) {
      return fallback;
    }
    return (short) (uri.hashCode() % Short.MAX_VALUE);
  }

  @Override
  public String getEventName() {
    return CameraViewManager.Events.EVENT_ON_PICTURE_SAVED.toString();
  }

  @Override
  public Bundle getEventBody() {
    return mResponse;
  }
}
