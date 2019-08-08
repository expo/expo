package versioned.host.exp.exponent.modules.api.reanimated.transitions;

import android.support.transition.SidePropagation;
import android.support.transition.Transition;
import android.support.transition.TransitionValues;
import android.view.View;
import android.view.ViewGroup;

public class SaneSidePropagation extends SidePropagation {

  @Override
  public long getStartDelay(ViewGroup sceneRoot, Transition transition, TransitionValues startValues, TransitionValues endValues) {
    long delay = super.getStartDelay(sceneRoot, transition, startValues, endValues);
    if (delay != 0) {
      if (endValues == null || getViewVisibility(startValues) == View.VISIBLE) {
        return -delay;
      }
    }
    return delay;
  }

}
