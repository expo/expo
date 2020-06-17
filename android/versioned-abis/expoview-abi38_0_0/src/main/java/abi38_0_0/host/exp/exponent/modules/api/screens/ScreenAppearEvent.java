package abi38_0_0.host.exp.exponent.modules.api.screens;

import abi38_0_0.com.facebook.react.bridge.Arguments;
import abi38_0_0.com.facebook.react.uimanager.events.Event;
import abi38_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

public class ScreenAppearEvent extends Event<ScreenAppearEvent> {

  public static final String EVENT_NAME = "topAppear";

  public ScreenAppearEvent(int viewId) {
    super(viewId);
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Override
  public short getCoalescingKey() {
    // All events for a given view can be coalesced.
    return 0;
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), Arguments.createMap());
  }
}
