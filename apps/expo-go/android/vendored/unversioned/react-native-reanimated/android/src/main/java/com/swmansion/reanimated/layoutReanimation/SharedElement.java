package com.swmansion.reanimated.layoutReanimation;

import android.view.View;

public class SharedElement {

  public View sourceView;
  public Snapshot sourceViewSnapshot;
  public View targetView;
  public Snapshot targetViewSnapshot;

  public SharedElement(
      View sourceView, Snapshot sourceViewSnapshot, View targetView, Snapshot targetViewSnapshot) {
    this.sourceView = sourceView;
    this.sourceViewSnapshot = sourceViewSnapshot;
    this.targetView = targetView;
    this.targetViewSnapshot = targetViewSnapshot;
  }
}
