package abi31_0_0.expo.core.interfaces.services;

import abi31_0_0.expo.core.interfaces.ActivityEventListener;
import abi31_0_0.expo.core.interfaces.LifecycleEventListener;

public interface UIManager {
  interface UIBlock<T> {
    void resolve(T view);
    void reject(Throwable throwable);
  }

  <T> void addUIBlock(int viewTag, UIBlock<T> block, Class<T> tClass);
  void runOnUiQueueThread(Runnable runnable);
  void runOnClientCodeQueueThread(Runnable runnable);
  void registerLifecycleEventListener(LifecycleEventListener listener);
  void unregisterLifecycleEventListener(LifecycleEventListener listener);
  void registerActivityEventListener(ActivityEventListener activityEventListener);
}
