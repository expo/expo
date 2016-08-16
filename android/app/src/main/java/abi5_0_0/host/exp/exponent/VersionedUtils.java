// Copyright 2015-present 650 Industries. All rights reserved.

package abi5_0_0.host.exp.exponent;

import abi5_0_0.com.facebook.react.LifecycleState;
import abi5_0_0.com.facebook.react.ReactInstanceManager;
import abi5_0_0.com.facebook.react.ReactPackage;
import abi5_0_0.com.facebook.react.shell.MainReactPackage;
import abi5_0_0.host.exp.exponent.modules.ExponentPackage;
import abi5_0_0.host.exp.exponent.modules.external.crypto.CryptoPackage;
import abi5_0_0.host.exp.exponent.modules.external.facebook.FacebookLoginPackage;
import abi5_0_0.host.exp.exponent.modules.external.image_picker.ImagePickerPackage;
import host.exp.exponent.experience.ExperienceActivity;

public class VersionedUtils {

  public static ReactInstanceManager.Builder getReactInstanceManagerBuilder(ExperienceActivity.InstanceManagerBuilderProperties instanceManagerBuilderProperties) {
    ReactInstanceManager.Builder builder = ReactInstanceManager.builder()
        .setApplication(instanceManagerBuilderProperties.application)
        .setJSBundleFile(instanceManagerBuilderProperties.jsBundlePath)
        .addPackage(new MainReactPackage())
        .addPackage(new FacebookLoginPackage(instanceManagerBuilderProperties.baseExperienceActivity, instanceManagerBuilderProperties.application))
        .addPackage((ReactPackage) instanceManagerBuilderProperties.linkingPackage.get())
        .addPackage(new CryptoPackage())
        .addPackage(new ImagePickerPackage(instanceManagerBuilderProperties.baseExperienceActivity))
        .addPackage(new ExponentPackage(instanceManagerBuilderProperties.application, instanceManagerBuilderProperties.experienceProperties, instanceManagerBuilderProperties.manifest))
        .setInitialLifecycleState(LifecycleState.RESUMED);
    return builder;
  }

}
