package com.swmansion.reanimated;

import com.facebook.proguard.annotations.DoNotStrip;
import com.swmansion.reanimated.ReanimatedMessageQueueThreadBase;

@DoNotStrip
public class ReanimatedMessageQueueThread extends ReanimatedMessageQueueThreadBase {
  @Override
  public boolean runOnQueue(Runnable runnable) {
    return messageQueueThread.runOnQueue(runnable);
  }

  @Override
  public boolean isIdle() {
    return messageQueueThread.isIdle();
  }
}
