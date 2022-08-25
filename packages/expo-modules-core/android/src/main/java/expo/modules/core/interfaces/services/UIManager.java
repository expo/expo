package expo.modules.core.interfaces.services;

import android.view.View;

import androidx.annotation.Nullable;

import expo.modules.core.interfaces.ActivityEventListener;
import expo.modules.core.interfaces.LifecycleEventListener;

public interface UIManager {
  interface UIBlock<T> {
    void resolve(T view);

    void reject(Throwable throwable);
  }

  interface ViewHolder {
    View get(Object key);
  }

  interface GroupUIBlock {
    void execute(ViewHolder viewHolder);
  }

  @Deprecated
  <T> void addUIBlock(int viewTag, UIBlock<T> block, Class<T> tClass);

  @Deprecated
  void addUIBlock(GroupUIBlock block);

  @Deprecated
  @Nullable
  View resolveView(int viewTag);

  void runOnUiQueueThread(Runnable runnable);

  void runOnClientCodeQueueThread(Runnable runnable);

  void runOnNativeModulesQueueThread(Runnable runnable);

  void registerLifecycleEventListener(LifecycleEventListener listener);

  void unregisterLifecycleEventListener(LifecycleEventListener listener);

  void registerActivityEventListener(ActivityEventListener activityEventListener);

  void unregisterActivityEventListener(ActivityEventListener activityEventListener);
}
