package com.swmansion.reanimated.layoutReanimation;

import java.util.HashMap;

public interface NativeMethodsHolder {
  void startAnimation(int tag, int type, HashMap<String, Object> values);

  boolean hasAnimation(int tag, int type);

  void clearAnimationConfig(int tag);

  void cancelAnimation(int tag, int type, boolean cancelled, boolean removeView);

  boolean isLayoutAnimationEnabled();

  int findPrecedingViewTagForTransition(int tag);
}
