// Copyright 2015-present 650 Industries. All rights reserved.

package abi39_0_0.host.exp.exponent;

import android.app.Activity;

import abi39_0_0.com.facebook.react.ReactInstanceManager;
import abi39_0_0.com.facebook.react.ReactInstanceManagerBuilder;
import abi39_0_0.com.facebook.react.common.LifecycleState;
import abi39_0_0.com.facebook.react.shell.MainReactPackage;

import java.util.Collections;

import host.exp.exponent.RNObject;
import host.exp.exponent.experience.ReactNativeActivity;
import host.exp.expoview.Exponent;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.ReanimatedJSIModulePackage;

public class VersionedUtils {

  public static ReactInstanceManagerBuilder getReactInstanceManagerBuilder(Exponent.InstanceManagerBuilderProperties instanceManagerBuilderProperties) {
    ReactInstanceManagerBuilder builder = ReactInstanceManager.builder()
        .setApplication(instanceManagerBuilderProperties.application)
        .setJSIModulesPackage((reactApplicationContext, jsContext) -> {
          Activity currentActivity = Exponent.getInstance().getCurrentActivity();
          if (currentActivity instanceof ReactNativeActivity) {
            ReactNativeActivity reactNativeActivity = (ReactNativeActivity) currentActivity;
            RNObject devSettings = reactNativeActivity.getDevSupportManager().callRecursive("getDevSettings");
            boolean isRemoteJSDebugEnabled = devSettings != null && (boolean) devSettings.call("isRemoteJSDebugEnabled");
            if (!isRemoteJSDebugEnabled) {
              return new ReanimatedJSIModulePackage().getJSIModules(reactApplicationContext, jsContext);
            }
          }
          return Collections.emptyList();
        })
        .addPackage(new MainReactPackage())
        .addPackage(new ExponentPackage(
                instanceManagerBuilderProperties.experienceProperties,
                instanceManagerBuilderProperties.manifest,
                null, null,
                instanceManagerBuilderProperties.singletonModules))
        .addPackage(new ExpoTurboPackage(
          instanceManagerBuilderProperties.experienceProperties,
          instanceManagerBuilderProperties.manifest))
        .setInitialLifecycleState(LifecycleState.BEFORE_CREATE);

    if (instanceManagerBuilderProperties.jsBundlePath != null && instanceManagerBuilderProperties.jsBundlePath.length() > 0) {
      builder = builder.setJSBundleFile(instanceManagerBuilderProperties.jsBundlePath);
    }

    return builder;
  }

}
