package abi28_0_0.host.exp.exponent.modules.api.components.payments;

import abi28_0_0.com.facebook.react.ReactPackage;
import abi28_0_0.com.facebook.react.bridge.JavaScriptModule;
import abi28_0_0.com.facebook.react.bridge.NativeModule;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class StripeReactPackage implements ReactPackage {

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new StripeModule(reactContext));
    return modules;
  }

  public List<Class<? extends JavaScriptModule>> createJSModules() {
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Arrays.<ViewManager>asList(new CustomCardInputReactManager());
  }
}
