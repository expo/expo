package com.swmansion.reanimated;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ReanimatedUIManager;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;

import java.util.List;

public class ReanimatedUIManagerFactory {

  static UIManagerModule create(ReactApplicationContext reactContext, List<ViewManager> viewManagers, int minTimeLeftInFrameForNonBatchedOperationMs) {
    return new ReanimatedUIManager(reactContext, viewManagers, minTimeLeftInFrameForNonBatchedOperationMs);
  }

}
