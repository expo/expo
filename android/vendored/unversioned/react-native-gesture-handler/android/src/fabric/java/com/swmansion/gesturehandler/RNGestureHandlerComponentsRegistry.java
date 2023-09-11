package com.swmansion.gesturehandler.react;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.fabric.ComponentFactory;
import com.facebook.soloader.SoLoader;

@DoNotStrip
public class RNGestureHandlerComponentsRegistry {
  static {
    SoLoader.loadLibrary("fabricjni");
    SoLoader.loadLibrary("gesturehandler");
  }

  @DoNotStrip private final HybridData mHybridData;

  @DoNotStrip
  private native HybridData initHybrid(ComponentFactory componentFactory);

  @DoNotStrip
  private RNGestureHandlerComponentsRegistry(ComponentFactory componentFactory) {
    mHybridData = initHybrid(componentFactory);
  }

  @DoNotStrip
  public static RNGestureHandlerComponentsRegistry register(ComponentFactory componentFactory) {
    return new RNGestureHandlerComponentsRegistry(componentFactory);
  }
}
