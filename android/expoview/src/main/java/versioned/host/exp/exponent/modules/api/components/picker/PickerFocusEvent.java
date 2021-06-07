package versioned.host.exp.exponent.modules.api.components.picker;

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

  private WritableMap getEventData() {
    WritableMap eventData = Arguments.createMap();
    eventData.putInt("target", getViewTag());
    return eventData;
  }
}
