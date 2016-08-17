// Copyright 2015-present 650 Industries. All rights reserved.

package abi5_0_0.host.exp.exponent.modules;

import android.content.Intent;
import android.support.annotation.NonNull;

import abi5_0_0.com.facebook.react.bridge.Promise;
import abi5_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi5_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi5_0_0.com.facebook.react.bridge.ReactMethod;

import host.exp.exponent.experience.BaseExperienceActivity;

public class ExponentUtilModule extends ReactContextBaseJavaModule {
  public ExponentUtilModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ExponentUtil";
  }

  @ReactMethod
  public void share(@NonNull final String prompt, @NonNull final String subject, final String contents, final Promise promise) {
    Intent intent = new Intent(android.content.Intent.ACTION_SEND);
    intent.setType("text/plain");
    intent.putExtra(Intent.EXTRA_SUBJECT, subject);
    if (contents != null) {
      intent.putExtra(Intent.EXTRA_TEXT, contents);
    }
    BaseExperienceActivity.getVisibleActivity().startActivity(Intent.createChooser(intent, prompt));
    promise.resolve(true);
  }
}
