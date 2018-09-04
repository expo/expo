package abi30_0_0.host.exp.exponent.modules.api.screens;

import abi30_0_0.com.facebook.react.ReactPackage;
import abi30_0_0.com.facebook.react.bridge.NativeModule;
import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi30_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class RNScreenPackage implements ReactPackage {
  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Arrays.<ViewManager>asList(
            new ScreenContainerViewManager(),
            new ScreenStackViewManager(),
            new ScreenViewManager()
    );
  }
}
