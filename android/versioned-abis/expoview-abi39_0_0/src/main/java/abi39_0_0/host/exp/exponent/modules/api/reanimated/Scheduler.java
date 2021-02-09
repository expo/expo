package abi39_0_0.host.exp.exponent.modules.api.reanimated;

import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import abi39_0_0.com.facebook.react.bridge.ReactApplicationContext;

public class Scheduler {

  @DoNotStrip
  @SuppressWarnings("unused")
  private final HybridData mHybridData;
  private final ReactApplicationContext mContext;

  private final Runnable mUIThreadRunnable = new Runnable() {
    @Override
    public void run() {
      triggerUI();
    }
  };

  public Scheduler(ReactApplicationContext context) {
    mHybridData = initHybrid();
    mContext = context;
  }

  private native HybridData initHybrid();

  private native void triggerUI();

  @DoNotStrip
  private void scheduleOnUI() {
    mContext.runOnUiQueueThread(mUIThreadRunnable);
  }

}
