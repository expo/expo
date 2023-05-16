package com.swmansion.reanimated.layoutReanimation;

import android.view.View;
import android.view.ViewGroup;

public interface ViewHierarchyObserver {
  void onViewRemoval(View view, ViewGroup parent, Runnable callback);

  void onViewCreate(View view, ViewGroup parent, Snapshot after);

  void onViewUpdate(View view, Snapshot before, Snapshot after);
}
