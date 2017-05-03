// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.api;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

public class ErrorRecoveryModule extends ReactContextBaseJavaModule {

  public ErrorRecoveryModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ExponentErrorRecovery";
  }

  @ReactMethod
  public void setRecoveryProps(final ReadableMap props) {

  }
}
