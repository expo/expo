package abi48_0_0.com.swmansion.reanimated;

import abi48_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi48_0_0.com.facebook.react.uimanager.ReanimatedUIManager;
import abi48_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi48_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.List;

public class ReanimatedUIManagerFactory {

  static UIManagerModule create(ReactApplicationContext reactContext, List<ViewManager> viewManagers, int minTimeLeftInFrameForNonBatchedOperationMs) {
    return new ReanimatedUIManager(reactContext, viewManagers, minTimeLeftInFrameForNonBatchedOperationMs);
  }

}
