package com.swmansion.reanimated.layoutReanimation;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.soloader.SoLoader;
import com.swmansion.reanimated.ReanimatedModule;
import java.lang.ref.WeakReference;
import java.util.Map;

public class LayoutAnimations {
  public static class Types {
    static final int ENTERING = 1;
    static final int EXITING = 2;
    static final int LAYOUT = 3;
    static final int SHARED_ELEMENT_TRANSITION = 4;
  }

  static {
    SoLoader.loadLibrary("reanimated");
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private final HybridData mHybridData;

  private final WeakReference<ReactApplicationContext> mContext;
  private WeakReference<AnimationsManager> mWeakAnimationsManager = new WeakReference<>(null);

  public LayoutAnimations(ReactApplicationContext context) {
    mContext = new WeakReference<>(context);
    mHybridData = initHybrid();
  }

  private native HybridData initHybrid();

  // LayoutReanimation
  public native void startAnimationForTag(int tag, int type, Map<String, String> values);

  public native boolean hasAnimationForTag(int tag, int type);

  public native void clearAnimationConfigForTag(int tag);

  public native void cancelAnimationForTag(
      int tag, int type, boolean cancelled, boolean removeView);

  public native boolean isLayoutAnimationEnabled();

  public native int findPrecedingViewTagForTransition(int tag);

  private void endLayoutAnimation(int tag, boolean cancelled, boolean removeView) {
    AnimationsManager animationsManager = getAnimationsManager();
    if (animationsManager == null) {
      return;
    }
    animationsManager.endLayoutAnimation(tag, cancelled, removeView);
  }

  private void progressLayoutAnimation(
      int tag, Map<String, Object> newStyle, boolean isSharedTransition) {
    AnimationsManager animationsManager = getAnimationsManager();
    if (animationsManager == null) {
      return;
    }
    animationsManager.progressLayoutAnimation(tag, newStyle, isSharedTransition);
  }

  private AnimationsManager getAnimationsManager() {
    AnimationsManager animationsManager = mWeakAnimationsManager.get();
    if (animationsManager != null) {
      return mWeakAnimationsManager.get();
    }

    ReactApplicationContext context = mContext.get();
    if (context == null) {
      return null;
    }

    animationsManager =
        context.getNativeModule(ReanimatedModule.class).getNodesManager().getAnimationsManager();

    mWeakAnimationsManager = new WeakReference<>(animationsManager);
    return animationsManager;
  }
}
