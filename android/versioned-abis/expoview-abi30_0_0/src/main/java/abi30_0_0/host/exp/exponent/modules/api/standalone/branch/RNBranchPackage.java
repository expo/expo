package abi30_0_0.host.exp.exponent.modules.api.standalone.branch;

import java.util.*;

import abi30_0_0.com.facebook.react.ReactPackage;
import abi30_0_0.com.facebook.react.bridge.JavaScriptModule;
import abi30_0_0.com.facebook.react.bridge.NativeModule;
import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi30_0_0.com.facebook.react.uimanager.ViewManager;


public class RNBranchPackage implements ReactPackage {
  @Override
  public List<NativeModule> createNativeModules(
                              ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();

    modules.add(new RNBranchModule(reactContext));

    return modules;
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
  	return Collections.emptyList();
  }
}
