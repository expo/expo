package abi24_0_0.host.exp.exponent.modules.api.components.camera.events;

import android.support.v4.util.Pools;

import abi24_0_0.com.facebook.react.bridge.Arguments;
import abi24_0_0.com.facebook.react.bridge.WritableMap;
import abi24_0_0.com.facebook.react.uimanager.events.Event;
import abi24_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

import abi24_0_0.host.exp.exponent.modules.api.components.camera.CameraViewManager;

public class CameraMountErrorEvent extends Event<CameraMountErrorEvent> {
  private static final Pools.SynchronizedPool<CameraMountErrorEvent> EVENTS_POOL = new Pools.SynchronizedPool<>(3);
  private CameraMountErrorEvent() {}

  public static CameraMountErrorEvent obtain(int viewTag) {
    CameraMountErrorEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new CameraMountErrorEvent();
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
    return CameraViewManager.Events.EVENT_ON_MOUNT_ERROR.toString();
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
  }

  private WritableMap serializeEventData() {
    return Arguments.createMap();
  }
}
