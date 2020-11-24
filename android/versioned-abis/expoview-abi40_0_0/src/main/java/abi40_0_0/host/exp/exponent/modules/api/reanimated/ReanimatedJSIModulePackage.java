package abi40_0_0.host.exp.exponent.modules.api.reanimated;

import abi40_0_0.com.facebook.react.bridge.JSIModulePackage;
import abi40_0_0.com.facebook.react.bridge.JSIModuleProvider;
import abi40_0_0.com.facebook.react.bridge.JSIModuleSpec;
import abi40_0_0.com.facebook.react.bridge.JSIModuleType;
import abi40_0_0.com.facebook.react.bridge.JavaScriptContextHolder;
import abi40_0_0.com.facebook.react.bridge.ReactApplicationContext;

import java.util.Arrays;
import java.util.List;

public class ReanimatedJSIModulePackage implements JSIModulePackage {

  @Override
  public List<JSIModuleSpec> getJSIModules(ReactApplicationContext reactApplicationContext, JavaScriptContextHolder jsContext) {
    NodesManager nodesManager = reactApplicationContext.getNativeModule(ReanimatedModule.class).getNodesManager();
    nodesManager.initWithContext(reactApplicationContext);
    return Arrays.<JSIModuleSpec>asList();
  }
}
