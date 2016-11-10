// Copyright 2015-present 650 Industries. All rights reserved.

package abi11_0_0.host.exp.exponent.modules.api;

import android.content.Intent;
import android.support.annotation.NonNull;

import abi11_0_0.com.facebook.react.bridge.Promise;
import abi11_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi11_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi11_0_0.com.facebook.react.bridge.ReactMethod;

import java.util.Map;

import javax.inject.Inject;

import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.experience.BaseExperienceActivity;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponentview.Exponent;

public class UtilModule extends ReactContextBaseJavaModule {

  @Inject
  Kernel mKernel;

  private final Map<String, Object> mExperienceProperties;

  public UtilModule(ReactApplicationContext reactContext,
                    Map<String, Object> experienceProperties) {
    super(reactContext);
    NativeModuleDepsProvider.getInstance().inject(this);

    mExperienceProperties = experienceProperties;
  }

  @Override
  public String getName() {
    return "ExponentUtil";
  }

  @ReactMethod
  public void shareAsync(@NonNull final String prompt, @NonNull final String subject, final String contents, final Promise promise) {
    Intent intent = new Intent(android.content.Intent.ACTION_SEND);
    intent.setType("text/plain");
    intent.putExtra(Intent.EXTRA_SUBJECT, subject);
    if (contents != null) {
      intent.putExtra(Intent.EXTRA_TEXT, contents);
    }
    BaseExperienceActivity.getVisibleActivity().startActivity(Intent.createChooser(intent, prompt));
    promise.resolve(true);
  }

  @ReactMethod
  public void reload() {
    mKernel.reloadVisibleExperience((String) mExperienceProperties.get(Kernel.MANIFEST_URL_KEY));
  }

  @ReactMethod
  public void getCurrentLocaleAsync(final Promise promise) {
    promise.resolve(getReactApplicationContext().getResources().getConfiguration().locale.toString());
  }
}
