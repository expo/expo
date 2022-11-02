package abi47_0_0.com.swmansion.reanimated.layoutReanimation;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import abi47_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi47_0_0.com.swmansion.reanimated.ReanimatedModule;
import java.lang.ref.WeakReference;
import java.util.Map;

public class LayoutAnimations {
  static {
    System.loadLibrary("reanimated_abi47_0_0");
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  private final HybridData mHybridData;

  private WeakReference<ReactApplicationContext> mContext;

  public LayoutAnimations(ReactApplicationContext context) {
    mContext = new WeakReference<>(context);
    mHybridData = initHybrid();
  }

  private native HybridData initHybrid();

  // LayoutReanimation
  public native void startAnimationForTag(int tag, String type, Map<String, String> values);

  public native void removeConfigForTag(int tag);

  public native boolean isLayoutAnimationEnabled();

  private void notifyAboutEnd(int tag, int cancelledInt) {
    ReactApplicationContext context = mContext.get();
    if (context != null) {
      context
          .getNativeModule(ReanimatedModule.class)
          .getNodesManager()
          .getAnimationsManager()
          .notifyAboutEnd(tag, (cancelledInt == 0) ? false : true);
    }
  }

  private void notifyAboutProgress(Map<String, Object> newStyle, int tag) {
    ReactApplicationContext context = mContext.get();
    if (context != null) {
      context
          .getNativeModule(ReanimatedModule.class)
          .getNodesManager()
          .getAnimationsManager()
          .notifyAboutProgress(newStyle, tag);
    }
  }
}
