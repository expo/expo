// Copyright 2015-present 650 Industries. All rights reserved.

package abi29_0_0.host.exp.exponent.modules.api;

import com.amplitude.api.AmplitudeClient;
import abi29_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi29_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi29_0_0.com.facebook.react.bridge.ReactMethod;
import abi29_0_0.com.facebook.react.bridge.ReadableArray;
import abi29_0_0.com.facebook.react.bridge.ReadableMap;

import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.utils.ScopedContext;
import abi29_0_0.host.exp.exponent.ReadableObjectUtils;

public class AmplitudeModule extends ReactContextBaseJavaModule {

  private ScopedContext mScopedContext;
  private AmplitudeClient mClient;

  public AmplitudeModule(ReactApplicationContext reactContext, ScopedContext scopedContext) {
    super(reactContext);
    mScopedContext = scopedContext;
  }

  @Override
  public String getName() {
    return "ExponentAmplitude";
  }

  @ReactMethod
  public void initialize(final String apiKey) {
    Analytics.resetAmplitudeDatabaseHelper();
    mClient = new AmplitudeClient();
    mClient.initialize(mScopedContext, apiKey);
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
      mClient.setUserProperties(ReadableObjectUtils.readableToJson(properties));
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
      mClient.logEvent(eventName, ReadableObjectUtils.readableToJson(properties));
    }
  }

  @ReactMethod
  public void setGroup(final String groupType, final ReadableArray groupNames) {
    if (mClient != null) {
      mClient.setGroup(groupType, ReadableObjectUtils.readableToJson(groupNames));
    }
  }
}
