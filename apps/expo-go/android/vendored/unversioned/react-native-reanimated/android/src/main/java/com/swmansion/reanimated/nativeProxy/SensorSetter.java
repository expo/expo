package com.swmansion.reanimated.nativeProxy;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;

@DoNotStrip
public class SensorSetter {

  @DoNotStrip private final HybridData mHybridData;

  @DoNotStrip
  private SensorSetter(HybridData hybridData) {
    mHybridData = hybridData;
  }

  public native void sensorSetter(float[] value, int orientationDegrees);
}
