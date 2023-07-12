package abi49_0_0.com.swmansion.reanimated.nativeProxy;

import androidx.annotation.Nullable;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import abi49_0_0.com.facebook.react.bridge.WritableArray;
import abi49_0_0.com.facebook.react.bridge.WritableMap;
import abi49_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi49_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

@DoNotStrip
public class EventHandler implements RCTEventEmitter {

  @DoNotStrip private final HybridData mHybridData;
  UIManagerModule.CustomEventNamesResolver mCustomEventNamesResolver;

  @DoNotStrip
  private EventHandler(HybridData hybridData) {
    mHybridData = hybridData;
  }

  @Override
  public void receiveEvent(int targetTag, String eventName, @Nullable WritableMap event) {
    String resolvedEventName = mCustomEventNamesResolver.resolveCustomEventName(eventName);
    receiveEvent(targetTag + resolvedEventName, event);
  }

  public native void receiveEvent(String eventKey, @Nullable WritableMap event);

  @Override
  public void receiveTouches(
      String eventName, WritableArray touches, WritableArray changedIndices) {
    // not interested in processing touch events this way, we process raw events only
  }
}
