package com.swmansion.reanimated.transitions;

import android.view.Gravity;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.DecelerateInterpolator;
import android.view.animation.LinearInterpolator;
import androidx.transition.ChangeBounds;
import androidx.transition.ChangeTransform;
import androidx.transition.Fade;
import androidx.transition.SidePropagation;
import androidx.transition.Slide;
import androidx.transition.Transition;
import androidx.transition.TransitionSet;
import androidx.transition.Visibility;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import javax.annotation.Nullable;

class TransitionUtils {

  static @Nullable Transition inflate(ReadableMap config) {
    String type = config.getString("type");
    if ("group".equals(type)) {
      return inflateGroup(config);
    } else if ("in".equals(type)) {
      return inflateIn(config);
    } else if ("out".equals(type)) {
      return inflateOut(config);
    } else if ("change".equals(type)) {
      return inflateChange(config);
    }
    throw new JSApplicationIllegalArgumentException("Unrecognized transition type " + type);
  }

  private static @Nullable Transition inflateGroup(ReadableMap config) {
    TransitionSet set = new TransitionSet();
    if (config.hasKey("sequence") && config.getBoolean("sequence")) {
      set.setOrdering(TransitionSet.ORDERING_SEQUENTIAL);
    } else {
      set.setOrdering(TransitionSet.ORDERING_TOGETHER);
    }
    ReadableArray transitions = config.getArray("transitions");
    for (int i = 0, size = transitions.size(); i < size; i++) {
      Transition next = inflate(transitions.getMap(i));
      if (next != null) {
        set.addTransition(next);
      }
    }
    return set;
  }

  static Visibility createVisibilityTransition(String type) {
    if (type == null || "none".equals(type)) {
      return null;
    } else if ("fade".equals(type)) {
      return new Fade(Fade.IN | Fade.OUT);
    } else if ("scale".equals(type)) {
      return new Scale();
    } else if ("slide-top".equals(type)) {
      return new Slide(Gravity.TOP);
    } else if ("slide-bottom".equals(type)) {
      return new Slide(Gravity.BOTTOM);
    } else if ("slide-right".equals(type)) {
      return new Slide(Gravity.RIGHT);
    } else if ("slide-left".equals(type)) {
      return new Slide(Gravity.LEFT);
    }
    throw new JSApplicationIllegalArgumentException("Invalid transition type " + type);
  }

  private static Transition inflateIn(ReadableMap config) {
    Visibility transition = createTransition(config.getString("animation"));
    if (transition == null) {
      return null;
    }
    transition.setMode(Visibility.MODE_IN);
    configureTransition(transition, config);
    return transition;
  }

  private static Transition inflateOut(ReadableMap config) {
    Visibility transition = createTransition(config.getString("animation"));
    if (transition == null) {
      return null;
    }
    transition.setMode(Visibility.MODE_OUT);
    configureTransition(transition, config);
    return transition;
  }

  private static Transition inflateChange(ReadableMap config) {
    ChangeBounds changeBounds = new ChangeBounds();
    ChangeTransform changeTransform = new ChangeTransform();
    configureTransition(changeBounds, config);
    configureTransition(changeTransform, config);
    return new TransitionSet().addTransition(changeBounds).addTransition(changeTransform);
  }

  private static Visibility createTransition(String type) {
    if (type == null || "none".equals(type)) {
      return null;
    } else if ("fade".equals(type)) {
      return new Fade(Fade.IN | Fade.OUT);
    } else if ("scale".equals(type)) {
      return new Scale();
    } else if ("slide-top".equals(type)) {
      return new Slide(Gravity.TOP);
    } else if ("slide-bottom".equals(type)) {
      return new Slide(Gravity.BOTTOM);
    } else if ("slide-right".equals(type)) {
      return new Slide(Gravity.RIGHT);
    } else if ("slide-left".equals(type)) {
      return new Slide(Gravity.LEFT);
    }
    throw new JSApplicationIllegalArgumentException("Invalid transition type " + type);
  }

  private static void configureTransition(Transition transition, ReadableMap params) {
    if (params.hasKey("durationMs")) {
      int durationMs = params.getInt("durationMs");
      transition.setDuration(durationMs);
    }
    if (params.hasKey("interpolation")) {
      String interpolation = params.getString("interpolation");
      if (interpolation.equals("easeIn")) {
        transition.setInterpolator(new AccelerateInterpolator());
      } else if (interpolation.equals("easeOut")) {
        transition.setInterpolator(new DecelerateInterpolator());
      } else if (interpolation.equals("easeInOut")) {
        transition.setInterpolator(new AccelerateDecelerateInterpolator());
      } else if (interpolation.equals("linear")) {
        transition.setInterpolator(new LinearInterpolator());
      } else {
        throw new JSApplicationIllegalArgumentException(
            "Invalid interpolation type " + interpolation);
      }
    }
    if (params.hasKey("propagation")) {
      String propagation = params.getString("propagation");
      SidePropagation sidePropagation = new SaneSidePropagation();
      if ("top".equals(propagation)) {
        sidePropagation.setSide(Gravity.BOTTOM);
      } else if ("bottom".equals(propagation)) {
        sidePropagation.setSide(Gravity.TOP);
      } else if ("left".equals(propagation)) {
        sidePropagation.setSide(Gravity.RIGHT);
      } else if ("right".equals(propagation)) {
        sidePropagation.setSide(Gravity.LEFT);
      }
      transition.setPropagation(sidePropagation);
    } else {
      transition.setPropagation(null);
    }
    if (params.hasKey("delayMs")) {
      int delayMs = params.getInt("delayMs");
      transition.setStartDelay(delayMs);
    }
  }
}
