// Copyright 2015-present 650 Industries. All rights reserved.

package abi5_0_0.host.exp.exponent.modules.external.crypto;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import abi5_0_0.com.facebook.react.ReactPackage;
import abi5_0_0.com.facebook.react.bridge.JavaScriptModule;
import abi5_0_0.com.facebook.react.bridge.NativeModule;
import abi5_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi5_0_0.com.facebook.react.uimanager.ViewManager;

public class CryptoPackage implements ReactPackage {
  private CryptoModule mModule;

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    mModule = new CryptoModule(reactContext);
    return Arrays.<NativeModule>asList(mModule);
  }

  @Override
  public List<Class<? extends JavaScriptModule>> createJSModules() {
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }
}
