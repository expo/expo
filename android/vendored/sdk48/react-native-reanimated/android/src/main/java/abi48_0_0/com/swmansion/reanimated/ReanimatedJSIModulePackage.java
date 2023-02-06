package abi48_0_0.com.swmansion.reanimated;

import android.util.Log;
import abi48_0_0.com.facebook.react.bridge.JSIModulePackage;
import abi48_0_0.com.facebook.react.bridge.JSIModuleSpec;
import abi48_0_0.com.facebook.react.bridge.JavaScriptContextHolder;
import abi48_0_0.com.facebook.react.bridge.ReactApplicationContext;
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
