// Copyright 2015-present 650 Industries. All rights reserved.

package abi30_0_0.host.exp.exponent.modules;

import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi30_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;

import host.exp.exponent.kernel.ExperienceId;

public abstract class ExpoBaseModule extends ReactContextBaseJavaModule {

  protected final ExperienceId experienceId;

  public ExpoBaseModule(ReactApplicationContext reactContext, ExperienceId experienceId) {
    super(reactContext);

    this.experienceId = experienceId;
  }
}
