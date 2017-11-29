package versioned.host.exp.exponent.modules.api.components.camera.events;

import android.support.v4.util.Pools;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import versioned.host.exp.exponent.modules.api.components.camera.CameraViewManager;
import versioned.host.exp.exponent.modules.api.components.facedetector.ExpoFaceDetector;

public class FaceDetectionErrorEvent extends Event<FaceDetectionErrorEvent> {
  private static final Pools.SynchronizedPool<FaceDetectionErrorEvent> EVENTS_POOL = new Pools.SynchronizedPool<>(3);
  private ExpoFaceDetector mFaceDetector;
  private FaceDetectionErrorEvent() {}

  public static FaceDetectionErrorEvent obtain(int viewTag, ExpoFaceDetector faceDetector) {
    FaceDetectionErrorEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new FaceDetectionErrorEvent();
    }
    event.init(viewTag, faceDetector);
    return event;
  }

  private void init(int viewTag, ExpoFaceDetector faceDetector) {
    super.init(viewTag);
    mFaceDetector = faceDetector;
  }

  @Override
  public short getCoalescingKey() {
    return 0;
  }

  @Override
  public String getEventName() {
    return CameraViewManager.Events.EVENT_ON_MOUNT_ERROR.toString();
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
  }

  private WritableMap serializeEventData() {
    WritableMap map = Arguments.createMap();
    map.putBoolean("isOperational", mFaceDetector.isOperational());
    return map;
  }
}
