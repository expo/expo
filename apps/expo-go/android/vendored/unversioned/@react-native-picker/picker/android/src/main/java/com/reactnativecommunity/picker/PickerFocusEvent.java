package com.reactnativecommunity.picker;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

public class PickerFocusEvent extends Event<PickerFocusEvent> {
  public static final String EVENT_NAME = "topFocus";
  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  public PickerFocusEvent(int id) {
    super(id);
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), getEventData());
  }

  /**
   * In RN version 0.65+ getEventData method is introduced
   * https://github.com/facebook/react-native/commit/72d0ddc16f2f631003c3486e0a59e50c145ec613
   *
   * In order to keep compatibility with 0.65+ and not introduce breaking change for that lib,
   * the only change is changing access modifier from `private` to `protected` without using @override annotation
   * (idk if it will not bring any "method is hidden, but should overriden" warning, but for now it just works)
   *
   * In future versions, where `dispatch` method will be removed, there will be need to make a breaking change here
   */
  protected WritableMap getEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("target", getViewTag());
    return eventData;
  }
}
