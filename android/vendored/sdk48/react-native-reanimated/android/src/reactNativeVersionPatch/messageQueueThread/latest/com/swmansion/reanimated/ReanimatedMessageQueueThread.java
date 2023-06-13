package abi48_0_0.com.swmansion.reanimated;

import com.facebook.proguard.annotations.DoNotStrip;
import abi48_0_0.com.swmansion.reanimated.ReanimatedMessageQueueThreadBase;

@DoNotStrip
public class ReanimatedMessageQueueThread extends ReanimatedMessageQueueThreadBase {
  @Override
  public boolean runOnQueue(Runnable runnable) {
    return messageQueueThread.runOnQueue(runnable);
  }
}
