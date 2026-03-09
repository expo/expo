package expo.modules.core.interfaces.services;

import expo.modules.core.interfaces.ActivityEventListener;
import expo.modules.core.interfaces.LifecycleEventListener;

public interface UIManager {
  void runOnUiQueueThread(Runnable runnable);

  void runOnClientCodeQueueThread(Runnable runnable);

  void registerLifecycleEventListener(LifecycleEventListener listener);

  void unregisterLifecycleEventListener(LifecycleEventListener listener);

  void registerActivityEventListener(ActivityEventListener activityEventListener);

  void unregisterActivityEventListener(ActivityEventListener activityEventListener);
}
