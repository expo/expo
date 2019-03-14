package org.unimodules.core.interfaces.services;

import android.view.View;

import org.unimodules.core.interfaces.ActivityEventListener;
import org.unimodules.core.interfaces.LifecycleEventListener;

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

  <T> void addUIBlock(int viewTag, UIBlock<T> block, Class<T> tClass);

  void addUIBlock(GroupUIBlock block);

  void runOnUiQueueThread(Runnable runnable);

  void runOnClientCodeQueueThread(Runnable runnable);

  void registerLifecycleEventListener(LifecycleEventListener listener);

  void unregisterLifecycleEventListener(LifecycleEventListener listener);

  void registerActivityEventListener(ActivityEventListener activityEventListener);

  void unregisterActivityEventListener(ActivityEventListener activityEventListener);
}
