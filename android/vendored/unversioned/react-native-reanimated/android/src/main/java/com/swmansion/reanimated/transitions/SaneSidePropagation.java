package com.swmansion.reanimated.transitions;

import android.view.View;
import android.view.ViewGroup;
import androidx.transition.SidePropagation;
import androidx.transition.Transition;
import androidx.transition.TransitionValues;

public class SaneSidePropagation extends SidePropagation {

  @Override
  public long getStartDelay(
      ViewGroup sceneRoot,
      Transition transition,
      TransitionValues startValues,
      TransitionValues endValues) {
    long delay = super.getStartDelay(sceneRoot, transition, startValues, endValues);
    if (delay != 0) {
      if (endValues == null || getViewVisibility(startValues) == View.VISIBLE) {
        return -delay;
      }
    }
    return delay;
  }
}
