package abi42_0_0.host.exp.exponent.modules.api.components.picker;

import abi42_0_0.com.facebook.react.bridge.Arguments;
import abi42_0_0.com.facebook.react.bridge.WritableMap;
import abi42_0_0.com.facebook.react.uimanager.events.Event;
import abi42_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

public class PickerBlurEvent extends Event<PickerBlurEvent> {
  public static final String EVENT_NAME = "topBlur";
  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  public PickerBlurEvent(int id) {
    super(id);
  }

  @Override
  public void dispatch(RCTEventEmitter rctEventEmitter) {
    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), getEventData());
  }

  private WritableMap getEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("target", getViewTag());
    return eventData;
  }
}
