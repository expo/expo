package com.swmansion.reanimated.layoutReanimation;

import java.util.HashMap;

public interface NativeMethodsHolder {
  public void startAnimationForTag(int tag, String type, HashMap<String, Float> values);

  public void removeConfigForTag(int tag);

  public boolean isLayoutAnimationEnabled();
}
