// Copyright 2015-present 650 Industries. All rights reserved.

package abi28_0_0.host.exp.exponent;

import abi28_0_0.com.facebook.react.ReactInstanceManager;
import abi28_0_0.com.facebook.react.ReactInstanceManagerBuilder;
import abi28_0_0.com.facebook.react.common.LifecycleState;
import abi28_0_0.com.facebook.react.shell.MainReactPackage;

import host.exp.expoview.Exponent;
import abi28_0_0.host.exp.exponent.modules.api.components.admob.RNAdMobPackage;

public class VersionedUtils {

  public static ReactInstanceManagerBuilder getReactInstanceManagerBuilder(Exponent.InstanceManagerBuilderProperties instanceManagerBuilderProperties) {
    ReactInstanceManagerBuilder builder = ReactInstanceManager.builder()
        .setApplication(instanceManagerBuilderProperties.application)
        .addPackage(new MainReactPackage())
        .addPackage(new RNAdMobPackage())
        .addPackage(new ExponentPackage(
                instanceManagerBuilderProperties.experienceProperties,
                instanceManagerBuilderProperties.manifest))
        .setInitialLifecycleState(LifecycleState.RESUMED);

    if (instanceManagerBuilderProperties.jsBundlePath != null && instanceManagerBuilderProperties.jsBundlePath.length() > 0) {
      builder = builder.setJSBundleFile(instanceManagerBuilderProperties.jsBundlePath);
    }

    return builder;
  }

}
