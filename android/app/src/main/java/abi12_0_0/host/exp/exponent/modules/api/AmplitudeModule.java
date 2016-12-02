// Copyright 2015-present 650 Industries. All rights reserved.

package abi12_0_0.host.exp.exponent.modules.api;

import com.amplitude.api.AmplitudeClient;
import abi12_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi12_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi12_0_0.com.facebook.react.bridge.ReactMethod;
import abi12_0_0.com.facebook.react.bridge.ReadableArray;
import abi12_0_0.com.facebook.react.bridge.ReadableMap;

import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.utils.JSONBundleConverter;
import host.exp.exponent.utils.ScopedContext;
import abi12_0_0.host.exp.exponent.ReadableObjectUtils;

public class AmplitudeModule extends ReactContextBaseJavaModule {

  private ReactApplicationContext mReactApplicationContext;
  private String mExperienceIdEncoded;
  private AmplitudeClient mClient;

  public AmplitudeModule(ReactApplicationContext reactContext, String experienceIdEncoded) {
    super(reactContext);
    mReactApplicationContext = reactContext;
    mExperienceIdEncoded = experienceIdEncoded;
  }

  @Override
  public String getName() {
    return "ExponentAmplitude";
  }

  @ReactMethod
  public void initialize(final String apiKey) {
    Analytics.resetAmplitudeDatabaseHelper();
    mClient = new AmplitudeClient();
    mClient.initialize(new ScopedContext(mReactApplicationContext, mExperienceIdEncoded), apiKey);
  }

  @ReactMethod
  public void setUserId(final String userId) {
    if (mClient != null) {
      mClient.setUserId(userId);
    }
  }

  @ReactMethod
  public void setUserProperties(final ReadableMap properties) {
    if (mClient != null) {
      mClient.setUserProperties(ReadableObjectUtils.readableMapToJson(properties));
    }
  }

  @ReactMethod
  public void clearUserProperties() {
    if (mClient != null) {
      mClient.clearUserProperties();
    }
  }

  @ReactMethod
  public void logEvent(final String eventName) {
    if (mClient != null) {
      mClient.logEvent(eventName);
    }
  }

  @ReactMethod
  public void logEventWithProperties(final String eventName, final ReadableMap properties) {
    if (mClient != null) {
      mClient.logEvent(eventName, ReadableObjectUtils.readableMapToJson(properties));
    }
  }

  @ReactMethod
  public void setGroup(final String groupType, final ReadableArray groupNames) {
    if (mClient != null) {
      mClient.setGroup(groupType, ReadableObjectUtils.readableArrayToJson(groupNames));
    }
  }
}
