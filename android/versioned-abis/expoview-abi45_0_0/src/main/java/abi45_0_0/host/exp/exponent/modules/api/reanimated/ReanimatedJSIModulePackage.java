package abi45_0_0.host.exp.exponent.modules.api.reanimated;

import android.util.Log;
import abi45_0_0.com.facebook.react.bridge.JSIModulePackage;
import abi45_0_0.com.facebook.react.bridge.JSIModuleSpec;
import abi45_0_0.com.facebook.react.bridge.JavaScriptContextHolder;
import abi45_0_0.com.facebook.react.bridge.ReactApplicationContext;
import java.util.Arrays;
import java.util.List;

public class ReanimatedJSIModulePackage implements JSIModulePackage {
  /**
   * @deprecated Since 2.5.0, Reanimated autoinstalls on Android - you can remove
   *     getJSIModulePackage() override in MainApplication.java.
   */
  @Deprecated
  public ReanimatedJSIModulePackage() {
    super();
  }

  @Override
  public List<JSIModuleSpec> getJSIModules(
      ReactApplicationContext reactApplicationContext, JavaScriptContextHolder jsContext) {
    Log.w(
        "[REANIMATED]",
        "Since 2.5.0, Reanimated autoinstalls on Android - you can remove getJSIModulePackage() override in MainApplication.java.");
    return Arrays.<JSIModuleSpec>asList();
  }
}
