// Copyright 2015-present 650 Industries. All rights reserved.

package abi30_0_0.host.exp.exponent.modules.api;

import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi30_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi30_0_0.com.facebook.react.bridge.ReactMethod;
import abi30_0_0.com.facebook.react.bridge.ReadableMap;

import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.ErrorRecoveryManager;
import abi30_0_0.host.exp.exponent.ReadableObjectUtils;
import abi30_0_0.host.exp.exponent.modules.ExpoBaseModule;

public class ErrorRecoveryModule extends ExpoBaseModule {

  public ErrorRecoveryModule(ReactApplicationContext reactContext, ExperienceId experienceId) {
    super(reactContext, experienceId);
  }

  @Override
  public String getName() {
    return "ExponentErrorRecovery";
  }

  @ReactMethod
  public void setRecoveryProps(final ReadableMap props) {
    ErrorRecoveryManager.getInstance(experienceId).setRecoveryProps(ReadableObjectUtils.readableToJson(props));
  }
}
