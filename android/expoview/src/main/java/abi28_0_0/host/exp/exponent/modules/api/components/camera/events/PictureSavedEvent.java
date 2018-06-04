package abi28_0_0.host.exp.exponent.modules.api.components.camera.events;

import android.support.v4.util.Pools;

import abi28_0_0.com.facebook.react.bridge.WritableMap;
import abi28_0_0.com.facebook.react.uimanager.events.Event;
import abi28_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

import abi28_0_0.host.exp.exponent.modules.api.components.camera.CameraViewManager;

public class PictureSavedEvent extends Event<PictureSavedEvent> {
  private static final Pools.SynchronizedPool<PictureSavedEvent> EVENTS_POOL = new Pools.SynchronizedPool<>(5);
  private PictureSavedEvent() {}

  private WritableMap mResponse;

  public static PictureSavedEvent obtain(int viewTag, WritableMap response) {
    PictureSavedEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new PictureSavedEvent();
    }
    event.init(viewTag, response);
    return event;
  }

  private void init(int viewTag, WritableMap response) {
    super.init(viewTag);
    mResponse = response;
  }

  @Override
  public short getCoalescingKey() {
    int hashCode = mResponse.getMap("data").getString("uri").hashCode() % Short.MAX_VALUE;
    return (short) hashCode;
  }

  @Override
  public String getEventName() {
    return CameraViewManager.Events.EVENT_ON_PICTURE_SAVED.toString();
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), mResponse);
  }
}
