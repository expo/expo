// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent;

import com.facebook.react.ReactInstanceManager;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.shell.MainReactPackage;

import host.exp.exponent.experience.ExperienceActivity;
import host.exp.exponentview.Exponent;

public class VersionedUtils {

  public static ReactInstanceManager.Builder getReactInstanceManagerBuilder(Exponent.InstanceManagerBuilderProperties instanceManagerBuilderProperties) {
    ReactInstanceManager.Builder builder = ReactInstanceManager.builder()
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
