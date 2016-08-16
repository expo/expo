// Copyright 2015-present 650 Industries. All rights reserved.

package abi5_0_0.host.exp.exponent.modules;

import com.facebook.device.yearclass.YearClass;
import abi5_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi5_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.Nullable;

public class ExponentDeviceClassModule extends ReactContextBaseJavaModule {

  public ExponentDeviceClassModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ExponentDeviceClassModule";
  }

  @Override
  @Nullable
  public Map<String, Object> getConstants() {
    HashMap<String, Object> constants = new HashMap<>();
    constants.put("year", YearClass.get(getReactApplicationContext()));
    return constants;
  }
}
