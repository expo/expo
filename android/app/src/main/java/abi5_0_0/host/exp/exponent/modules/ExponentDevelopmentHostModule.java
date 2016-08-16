// Copyright 2015-present 650 Industries. All rights reserved.

package abi5_0_0.host.exp.exponent.modules;

import android.support.annotation.Nullable;

import java.util.Map;

import abi5_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi5_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi5_0_0.com.facebook.react.common.MapBuilder;
import host.exp.exponent.generated.ExponentBuildConstants;

public class ExponentDevelopmentHostModule extends ReactContextBaseJavaModule {
  public ExponentDevelopmentHostModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ExponentDevelopmentHost";
  }

  @Nullable
  @Override
  public Map<String, Object> getConstants() {
    return MapBuilder.<String, Object>of(
        "ngrokUrl", ExponentBuildConstants.BUILD_MACHINE_KERNEL_NGROK_URL,
        "localIpAddress", ExponentBuildConstants.BUILD_MACHINE_IP_ADDRESS,
        "localHostname", ExponentBuildConstants.BUILD_MACHINE_LOCAL_HOSTNAME
    );
  }
}
