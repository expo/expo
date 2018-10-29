package abi28_0_0.host.exp.exponent.modules.api.components.camera.events;

import android.support.v4.util.Pools;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
import abi28_0_0.com.facebook.react.uimanager.events.Event;
import abi28_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

import abi28_0_0.host.exp.exponent.modules.api.components.camera.CameraViewManager;

public class CameraMountErrorEvent extends Event<CameraMountErrorEvent> {
  private static final Pools.SynchronizedPool<CameraMountErrorEvent> EVENTS_POOL = new Pools.SynchronizedPool<>(3);
  private String mMessage;
  private CameraMountErrorEvent() {}

  public static CameraMountErrorEvent obtain(int viewTag, String message) {
    CameraMountErrorEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new CameraMountErrorEvent();
    }
    event.init(viewTag, message);
    return event;
  }

  private void init(
      int viewTag,
      String message
  ) {
    super.init(viewTag);
    mMessage = message;
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
    WritableMap event = Arguments.createMap();
    event.putString("message", mMessage);
    return event;
  }
}
