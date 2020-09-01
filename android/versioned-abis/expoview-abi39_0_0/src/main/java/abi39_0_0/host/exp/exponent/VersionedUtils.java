// Copyright 2015-present 650 Industries. All rights reserved.

package abi39_0_0.host.exp.exponent;

import abi39_0_0.com.facebook.react.ReactInstanceManager;
import abi39_0_0.com.facebook.react.ReactInstanceManagerBuilder;
import abi39_0_0.com.facebook.react.common.LifecycleState;
import abi39_0_0.com.facebook.react.shell.MainReactPackage;

import host.exp.expoview.Exponent;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.ReanimatedJSIModulePackage;

public class VersionedUtils {

  public static ReactInstanceManagerBuilder getReactInstanceManagerBuilder(Exponent.InstanceManagerBuilderProperties instanceManagerBuilderProperties) {
    ReactInstanceManagerBuilder builder = ReactInstanceManager.builder()
        .setApplication(instanceManagerBuilderProperties.application)
        .setJSIModulesPackage(new ReanimatedJSIModulePackage())
        .addPackage(new MainReactPackage())
        .addPackage(new ExponentPackage(
                instanceManagerBuilderProperties.experienceProperties,
                instanceManagerBuilderProperties.manifest,
                null, null,
                instanceManagerBuilderProperties.singletonModules))
        .addPackage(ExpoTurboPackage.createWithManifest(
        instanceManagerBuilderProperties.manifest))
        .setInitialLifecycleState(LifecycleState.BEFORE_CREATE);

    if (instanceManagerBuilderProperties.jsBundlePath != null && instanceManagerBuilderProperties.jsBundlePath.length() > 0) {
      builder = builder.setJSBundleFile(instanceManagerBuilderProperties.jsBundlePath);
    }

    return builder;
  }

}
