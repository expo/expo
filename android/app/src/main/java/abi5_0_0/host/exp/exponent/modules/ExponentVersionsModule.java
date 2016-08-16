// Copyright 2015-present 650 Industries. All rights reserved.

package abi5_0_0.host.exp.exponent.modules;

import java.util.Map;

import javax.inject.Inject;

import abi5_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi5_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi5_0_0.com.facebook.react.common.MapBuilder;
import host.exp.exponent.ExponentApplication;
import host.exp.exponent.generated.ExponentBuildConstants;
import host.exp.exponent.kernel.Kernel;

public class ExponentVersionsModule extends ReactContextBaseJavaModule {

  @Inject
  Kernel mKernel;

  public ExponentVersionsModule(ReactApplicationContext reactContext, ExponentApplication application) {
    super(reactContext);
    application.getAppComponent().inject(this);
  }

  @Override
  public String getName() {
    return "ExponentVersions";
  }

  @Override
  public Map<String, Object> getConstants() {
    return MapBuilder.<String, Object>of(
        "exponent", Kernel.getVersionName()
    );
  }
}
