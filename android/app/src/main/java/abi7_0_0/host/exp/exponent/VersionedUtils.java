// Copyright 2015-present 650 Industries. All rights reserved.

package abi7_0_0.host.exp.exponent;

import abi7_0_0.com.facebook.react.LifecycleState;
import abi7_0_0.com.facebook.react.ReactInstanceManager;
import abi7_0_0.com.facebook.react.shell.MainReactPackage;

import host.exp.exponent.experience.ExperienceActivity;

public class VersionedUtils {

  public static ReactInstanceManager.Builder getReactInstanceManagerBuilder(ExperienceActivity.InstanceManagerBuilderProperties instanceManagerBuilderProperties) {
    ReactInstanceManager.Builder builder = ReactInstanceManager.builder()
        .setApplication(instanceManagerBuilderProperties.application)
        .setJSBundleFile(instanceManagerBuilderProperties.jsBundlePath)
        .addPackage(new MainReactPackage())
        .addPackage(new ExponentPackage(instanceManagerBuilderProperties.application,
                instanceManagerBuilderProperties.experienceProperties,
                instanceManagerBuilderProperties.manifest,
                instanceManagerBuilderProperties.baseExperienceActivity))
        .setInitialLifecycleState(LifecycleState.RESUMED);
    return builder;
  }

}
