package abi42_0_0.expo.modules.camera.events;

import android.os.Bundle;
import androidx.core.util.Pools;

import abi42_0_0.org.unimodules.core.interfaces.services.EventEmitter;

import abi42_0_0.expo.modules.camera.CameraViewManager;
import abi42_0_0.expo.modules.interfaces.facedetector.FaceDetectorInterface;

public class FaceDetectionErrorEvent extends EventEmitter.BaseEvent {
  private static final Pools.SynchronizedPool<FaceDetectionErrorEvent> EVENTS_POOL = new Pools.SynchronizedPool<>(3);
  private FaceDetectorInterface mFaceDetector;

  private FaceDetectionErrorEvent() {
  }

  public static FaceDetectionErrorEvent obtain(FaceDetectorInterface faceDetector) {
    FaceDetectionErrorEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new FaceDetectionErrorEvent();
    }
    event.init(faceDetector);
    return event;
  }

  private void init(FaceDetectorInterface faceDetector) {
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
    return mFaceDetector != null;
  }
}
