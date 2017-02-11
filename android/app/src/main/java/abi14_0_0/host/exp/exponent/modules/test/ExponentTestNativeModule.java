// Copyright 2015-present 650 Industries. All rights reserved.

package abi14_0_0.host.exp.exponent.modules.test;

import abi14_0_0.com.facebook.react.bridge.Promise;
import abi14_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi14_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi14_0_0.com.facebook.react.bridge.ReactMethod;
import abi14_0_0.com.facebook.react.bridge.ReadableMap;

import de.greenrobot.event.EventBus;
import host.exp.exponent.test.TestCompletedEvent;
import host.exp.exponent.test.TestActionEvent;

public class ExponentTestNativeModule extends ReactContextBaseJavaModule {

  public ExponentTestNativeModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ExponentTest";
  }

}
