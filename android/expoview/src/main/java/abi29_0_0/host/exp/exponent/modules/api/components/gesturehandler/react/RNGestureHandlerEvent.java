package abi29_0_0.host.exp.exponent.modules.api.components.gesturehandler.react;

import android.support.v4.util.Pools;

import abi29_0_0.com.facebook.react.bridge.Arguments;
import abi29_0_0.com.facebook.react.bridge.WritableMap;
import abi29_0_0.com.facebook.react.uimanager.events.Event;
import abi29_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;
import abi29_0_0.host.exp.exponent.modules.api.components.gesturehandler.GestureHandler;

import javax.annotation.Nullable;

public class RNGestureHandlerEvent extends Event<RNGestureHandlerEvent> {

  public static final String EVENT_NAME = "onGestureHandlerEvent";

  private static final int TOUCH_EVENTS_POOL_SIZE = 7; // magic

  private static final Pools.SynchronizedPool<RNGestureHandlerEvent> EVENTS_POOL =
          new Pools.SynchronizedPool<>(TOUCH_EVENTS_POOL_SIZE);

  public static RNGestureHandlerEvent obtain(
          GestureHandler handler,
          @Nullable RNGestureHandlerEventDataExtractor dataExtractor) {
    RNGestureHandlerEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new RNGestureHandlerEvent();
    }
    event.init(handler, dataExtractor);
    return event;
  }

  private WritableMap mExtraData;

  private RNGestureHandlerEvent() {
  }

  private void init(
          GestureHandler handler,
          @Nullable RNGestureHandlerEventDataExtractor dataExtractor) {
    super.init(handler.getView().getId());
    mExtraData = Arguments.createMap();
    if (dataExtractor != null) {
      dataExtractor.extractEventData(handler, mExtraData);
    }
    mExtraData.putInt("handlerTag", handler.getTag());
    mExtraData.putInt("state", handler.getState());
  }

  @Override
  public void onDispose() {
    mExtraData = null;
    EVENTS_POOL.release(this);
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public boolean canCoalesce() {
    // TODO: coalescing
    return false;
  }

  @Override
  public short getCoalescingKey() {
    // TODO: coalescing
    return 0;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), EVENT_NAME, mExtraData);
  }
}
