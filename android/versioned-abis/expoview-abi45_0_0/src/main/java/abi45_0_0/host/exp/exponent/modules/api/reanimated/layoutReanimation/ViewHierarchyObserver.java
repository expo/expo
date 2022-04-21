package abi45_0_0.host.exp.exponent.modules.api.reanimated.layoutReanimation;

import android.view.View;
import android.view.ViewGroup;

public interface ViewHierarchyObserver {
  void onViewRemoval(View view, ViewGroup parent, Snapshot before, Runnable callback);

  void onViewCreate(View view, ViewGroup parent, Snapshot after);

  void onViewUpdate(View view, Snapshot before, Snapshot after);
}
