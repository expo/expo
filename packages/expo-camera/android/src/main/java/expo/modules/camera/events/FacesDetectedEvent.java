package expo.modules.camera.events;

import android.os.Bundle;
import androidx.core.util.Pools;

import java.util.List;

import org.unimodules.core.interfaces.services.EventEmitter;
import expo.modules.camera.CameraViewManager;

public class FacesDetectedEvent extends EventEmitter.BaseEvent {
  private static final Pools.SynchronizedPool<FacesDetectedEvent> EVENTS_POOL =
      new Pools.SynchronizedPool<>(3);

  private List<Bundle> mFaces;
  private int mViewTag;

  private FacesDetectedEvent() {}

  public static FacesDetectedEvent obtain(int viewTag, List<Bundle> faces) {
    FacesDetectedEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new FacesDetectedEvent();
    }
    event.init(viewTag, faces);
    return event;
  }

  private void init(int viewTag, List<Bundle> faces) {
    mViewTag = viewTag;
    mFaces = faces;
  }

  /**
   * note(@sjchmiela)
   * Should events about detected faces coalesce, the best strategy will be
   * to ensure that events with different faces count are always being transmitted.
   */
  @Override
  public short getCoalescingKey() {
    if (mFaces.size() > Short.MAX_VALUE) {
      return Short.MAX_VALUE;
    }

    return (short) mFaces.size();
  }

  @Override
  public String getEventName() {
    return CameraViewManager.Events.EVENT_ON_FACES_DETECTED.toString();
  }

  @Override
  public Bundle getEventBody() {
    Bundle event = new Bundle();
    event.putString("type", "face");
    Bundle[] bundle = new Bundle[mFaces.size()];
    mFaces.toArray(bundle);
    event.putParcelableArray("faces", bundle);
    event.putInt("target", mViewTag);
    return event;
  }
}
