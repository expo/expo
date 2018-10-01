// Copyright 2015-present 650 Industries. All rights reserved.

package abi30_0_0.host.exp.exponent.modules;

import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;

import javax.inject.Inject;

import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.ExpoKernelServiceRegistry;

public abstract class ExpoKernelServiceConsumerBaseModule extends ExpoBaseModule {
  @Inject
  protected ExpoKernelServiceRegistry mKernelServiceRegistry;

  public ExpoKernelServiceConsumerBaseModule(ReactApplicationContext reactContext, ExperienceId experienceId) {
    super(reactContext, experienceId);
    NativeModuleDepsProvider.getInstance().inject(ExpoKernelServiceConsumerBaseModule.class, this);
  }
}
