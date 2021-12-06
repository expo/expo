package abi44_0_0.host.exp.exponent.modules.api.reanimated;

import abi44_0_0.com.facebook.react.bridge.WritableArray;
import abi44_0_0.com.facebook.react.bridge.WritableMap;
import abi44_0_0.com.facebook.react.uimanager.events.Event;
import abi44_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

import androidx.annotation.Nullable;

public class CopiedEvent {
  private int targetTag;
  private String eventName;
  private WritableMap payload;

  CopiedEvent(Event event) {
    event.dispatch(new RCTEventEmitter() {
      @Override
      public void receiveEvent(int targetTag, String eventName, @Nullable WritableMap event) {
        CopiedEvent.this.targetTag = targetTag;
        CopiedEvent.this.eventName = eventName;
        CopiedEvent.this.payload = event.copy();
      }

      @Override
      public void receiveTouches(String eventName, WritableArray touches, WritableArray changedIndices) {
        //noop
      }
    });
  }

  public int getTargetTag() {
    return targetTag;
  }

  public String getEventName() {
    return eventName;
  }

  public WritableMap getPayload() {
    return payload;
  }
}
