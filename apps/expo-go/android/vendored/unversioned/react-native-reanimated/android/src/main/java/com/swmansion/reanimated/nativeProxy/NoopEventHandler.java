package com.swmansion.reanimated.nativeProxy;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;

public class NoopEventHandler implements RCTEventEmitter {
  @Override
  public void receiveEvent(int targetTag, String eventName, @Nullable WritableMap event) {
    // NOOP
  }

  @Override
  public void receiveTouches(
      String eventName, WritableArray touches, WritableArray changedIndices) {
    // NOOP
  }
}
