package abi41_0_0.host.exp.exponent.modules.api.reanimated;

import abi41_0_0.com.facebook.react.bridge.JSIModulePackage;
import abi41_0_0.com.facebook.react.bridge.JSIModuleProvider;
import abi41_0_0.com.facebook.react.bridge.JSIModuleSpec;
import abi41_0_0.com.facebook.react.bridge.JSIModuleType;
import abi41_0_0.com.facebook.react.bridge.JavaScriptContextHolder;
import abi41_0_0.com.facebook.react.bridge.ReactApplicationContext;

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
