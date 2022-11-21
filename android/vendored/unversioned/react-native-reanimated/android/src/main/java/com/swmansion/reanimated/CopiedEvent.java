package com.swmansion.reanimated;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

public class CopiedEvent {
  private int targetTag;
  private String eventName;
  private WritableMap payload;

  CopiedEvent(Event event) {
    event.dispatch(
        new RCTEventEmitter() {
          @Override
          public void receiveEvent(int targetTag, String eventName, @Nullable WritableMap event) {
            CopiedEvent.this.targetTag = targetTag;
            CopiedEvent.this.eventName = eventName;
            CopiedEvent.this.payload = event.copy();
          }

          @Override
          public void receiveTouches(
              String eventName, WritableArray touches, WritableArray changedIndices) {
            // noop
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
