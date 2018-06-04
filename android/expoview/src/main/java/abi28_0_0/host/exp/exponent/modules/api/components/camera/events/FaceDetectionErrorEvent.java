package abi28_0_0.host.exp.exponent.modules.api.components.camera.events;

import android.support.v4.util.Pools;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
import abi28_0_0.com.facebook.react.uimanager.events.Event;
import abi28_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

import abi28_0_0.host.exp.exponent.modules.api.components.camera.CameraViewManager;
import abi28_0_0.host.exp.exponent.modules.api.components.facedetector.ExpoFaceDetector;

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
