package abi46_0_0.host.exp.exponent.modules.api.components.maskedview;

import abi46_0_0.com.facebook.react.ReactPackage;
import abi46_0_0.com.facebook.react.bridge.JavaScriptModule;
import abi46_0_0.com.facebook.react.bridge.NativeModule;
import abi46_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi46_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class RNCMaskedViewPackage implements ReactPackage {
  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactApplicationContext) {
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactApplicationContext) {
      return Arrays.<ViewManager>asList(
            new RNCMaskedViewManager()
      );
  }
}
