package com.swmansion.reanimated.layoutReanimation;

import java.util.HashMap;

public interface NativeMethodsHolder {
  void startAnimation(int tag, int type, HashMap<String, Object> values);

  boolean shouldAnimateExiting(int tag, boolean shouldAnimate);

  boolean hasAnimation(int tag, int type);

  void clearAnimationConfig(int tag);

  void cancelAnimation(int tag);

  boolean isLayoutAnimationEnabled();

  int findPrecedingViewTagForTransition(int tag);

  void checkDuplicateSharedTag(int viewTag, int screenTag);
}
