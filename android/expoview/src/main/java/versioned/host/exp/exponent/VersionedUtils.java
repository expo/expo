// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactInstanceManagerBuilder;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.shell.MainReactPackage;

import host.exp.expoview.Exponent;

public class VersionedUtils {

  public static ReactInstanceManagerBuilder getReactInstanceManagerBuilder(Exponent.InstanceManagerBuilderProperties instanceManagerBuilderProperties) {
    ReactInstanceManagerBuilder builder = ReactInstanceManager.builder()
        .setApplication(instanceManagerBuilderProperties.application)
        .addPackage(new MainReactPackage())
        .addPackage(new ExponentPackage(
                instanceManagerBuilderProperties.experienceProperties,
                instanceManagerBuilderProperties.manifest,
                // When distributing change the following two arguments to nulls
                instanceManagerBuilderProperties.expoPackages,
                instanceManagerBuilderProperties.exponentPackageDelegate))
        .setInitialLifecycleState(LifecycleState.RESUMED);

    if (instanceManagerBuilderProperties.jsBundlePath != null && instanceManagerBuilderProperties.jsBundlePath.length() > 0) {
      builder = builder.setJSBundleFile(instanceManagerBuilderProperties.jsBundlePath);
    }

    return builder;
  }

}
