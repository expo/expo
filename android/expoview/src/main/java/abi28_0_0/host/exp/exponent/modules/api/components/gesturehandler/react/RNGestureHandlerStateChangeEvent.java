package abi28_0_0.host.exp.exponent.modules.api.components.gesturehandler.react;

import android.support.v4.util.Pools;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.WritableMap;
import abi28_0_0.com.facebook.react.uimanager.events.Event;
import abi28_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;
import abi28_0_0.host.exp.exponent.modules.api.components.gesturehandler.GestureHandler;

import javax.annotation.Nullable;

public class RNGestureHandlerStateChangeEvent extends Event<RNGestureHandlerStateChangeEvent>{

  public static final String EVENT_NAME = "topGestureHandlerStateChange";
  public static final String REGISTRATION_NAME = "onGestureHandlerStateChange";

  private static final int TOUCH_EVENTS_POOL_SIZE = 7; // magic

  private static final Pools.SynchronizedPool<RNGestureHandlerStateChangeEvent> EVENTS_POOL =
          new Pools.SynchronizedPool<>(TOUCH_EVENTS_POOL_SIZE);

  public static RNGestureHandlerStateChangeEvent obtain(
          GestureHandler handler,
          int newState,
          int oldState,
          @Nullable RNGestureHandlerEventDataExtractor dataExtractor) {
    RNGestureHandlerStateChangeEvent event = EVENTS_POOL.acquire();
    if (event == null) {
      event = new RNGestureHandlerStateChangeEvent();
    }
    event.init(handler, newState, oldState, dataExtractor);
    return event;
  }

  private WritableMap mExtraData;

  private RNGestureHandlerStateChangeEvent() {
  }

  private void init(
          GestureHandler handler,
          int newState,
          int oldState,
          @Nullable RNGestureHandlerEventDataExtractor dataExtractor) {
    super.init(handler.getView().getId());
    mExtraData = Arguments.createMap();
    if (dataExtractor != null) {
      dataExtractor.extractEventData(handler, mExtraData);
    }
    mExtraData.putInt("handlerTag", handler.getTag());
    mExtraData.putInt("state", newState);
    mExtraData.putInt("oldState", oldState);
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
