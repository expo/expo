package expo.modules.camera.events;

import android.os.Bundle;
import android.support.v4.util.Pools;

import expo.core.interfaces.services.EventEmitter;
import expo.interfaces.facedetector.FaceDetector;
import expo.modules.camera.CameraViewManager;

public class FaceDetectionErrorEvent extends EventEmitter.BaseEvent {
  private static final Pools.SynchronizedPool<FaceDetectionErrorEvent> EVENTS_POOL = new Pools.SynchronizedPool<>(3);
  private FaceDetector mFaceDetector;
  private FaceDetectionErrorEvent() {}

  public static FaceDetectionErrorEvent obtain(FaceDetector faceDetector) {
    FaceDetectionErrorEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new FaceDetectionErrorEvent();
    }
    event.init(faceDetector);
    return event;
  }

  private void init(FaceDetector faceDetector) {
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

  public Bundle getEventBody() {
    Bundle map = new Bundle();
    map.putBoolean("isOperational", isFaceDetectorOperational());
    return map;
  }

  private boolean isFaceDetectorOperational() {
    if (mFaceDetector == null) {
      return false;
    }

    return mFaceDetector.isOperational();
  }
}
