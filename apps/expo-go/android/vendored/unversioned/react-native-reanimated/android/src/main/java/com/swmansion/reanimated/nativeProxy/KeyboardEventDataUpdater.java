package com.swmansion.reanimated.nativeProxy;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public class KeyboardEventDataUpdater {
  @DoNotStrip private final HybridData mHybridData;

  @DoNotStrip
  private KeyboardEventDataUpdater(HybridData hybridData) {
    mHybridData = hybridData;
  }

  public native void keyboardEventDataUpdater(int keyboardState, int height);
}
