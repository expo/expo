// Copyright 2015-present 650 Industries. All rights reserved.

package abi17_0_0.host.exp.exponent;

import abi17_0_0.com.facebook.react.ReactInstanceManager;
import abi17_0_0.com.facebook.react.ReactInstanceManagerBuilder;
import abi17_0_0.com.facebook.react.common.LifecycleState;
import abi17_0_0.com.facebook.react.shell.MainReactPackage;

import host.exp.expoview.Exponent;

public class VersionedUtils {

  public static ReactInstanceManagerBuilder getReactInstanceManagerBuilder(Exponent.InstanceManagerBuilderProperties instanceManagerBuilderProperties) {
    ReactInstanceManagerBuilder builder = ReactInstanceManager.builder()
        .setApplication(instanceManagerBuilderProperties.application)
        .setJSBundleFile(instanceManagerBuilderProperties.jsBundlePath)
        .addPackage(new MainReactPackage())
        .addPackage(new ExponentPackage(
                instanceManagerBuilderProperties.experienceProperties,
                instanceManagerBuilderProperties.manifest))
        .setInitialLifecycleState(LifecycleState.RESUMED);
    return builder;
  }

}
