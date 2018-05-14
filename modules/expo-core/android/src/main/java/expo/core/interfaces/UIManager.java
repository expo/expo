package expo.core.interfaces;

import android.view.View;

import expo.core.LifecycleEventListener;

public interface UIManager {
  interface UIBlock<T> {
    void resolve(T view);
    void reject(Throwable throwable);
  }

  <T extends View> void addUIBlock(int viewTag, UIBlock<T> block);
  void registerLifecycleEventListener(LifecycleEventListener listener);
  void unregisterLifecycleEventListener(LifecycleEventListener listener);
}
