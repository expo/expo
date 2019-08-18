// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import host.exp.exponent.kernel.ExperienceId;

public abstract class ExpoBaseModule extends ReactContextBaseJavaModule {

  protected final ExperienceId experienceId;

  public ExpoBaseModule(ReactApplicationContext reactContext, ExperienceId experienceId) {
    super(reactContext);

    this.experienceId = experienceId;
  }
}
