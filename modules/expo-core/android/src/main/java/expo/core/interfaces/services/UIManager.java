package expo.core.interfaces.services;

import expo.core.interfaces.LifecycleEventListener;

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
}
