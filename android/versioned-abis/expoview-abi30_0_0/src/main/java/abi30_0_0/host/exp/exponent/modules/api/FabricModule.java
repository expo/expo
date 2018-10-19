// Copyright 2015-present 650 Industries. All rights reserved.

package abi30_0_0.host.exp.exponent.modules.api;

import com.crashlytics.android.answers.Answers;
import com.crashlytics.android.answers.CustomEvent;
import abi30_0_0.com.facebook.react.bridge.Arguments;
import abi30_0_0.com.facebook.react.bridge.Promise;
import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi30_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi30_0_0.com.facebook.react.bridge.ReactMethod;
import abi30_0_0.com.facebook.react.bridge.ReadableMap;
import abi30_0_0.com.facebook.react.bridge.ReadableMapKeySetIterator;

import java.util.Map;

import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.Constants;
import host.exp.expoview.ExpoViewBuildConfig;

public class FabricModule extends ReactContextBaseJavaModule {
  boolean mInScope = false;

  public FabricModule(ReactApplicationContext reactContext, Map<String, Object> experienceProperties) {

    super(reactContext);
    String manifestUrl = (String) experienceProperties.get(KernelConstants.MANIFEST_URL_KEY);
    mInScope = manifestUrl != null && manifestUrl.equals(Constants.INITIAL_URL);
  }

  @Override
  public String getName() {
    return "ExponentFabric";
  }

  @ReactMethod
  public void answersLogCustomAsync(final String eventName, final ReadableMap attributes, final Promise promise) {
    if (!mInScope) {
      promise.reject(new IllegalStateException("Not in a standalone app!"));
      return;
    }
    if (ExpoViewBuildConfig.DEBUG) {
      promise.resolve(Arguments.createMap());
      return;
    }

    CustomEvent event = new CustomEvent(eventName);
    ReadableMapKeySetIterator iterator = attributes.keySetIterator();
    while (iterator.hasNextKey()) {
      String key = iterator.nextKey();
      switch (attributes.getType(key)) {
        case Number:
          event.putCustomAttribute(key, attributes.getDouble(key));
          break;
        case String:
          event.putCustomAttribute(key, attributes.getString(key));
          break;
      }
    }
    Answers.getInstance().logCustom(event);

    promise.resolve(Arguments.createMap());
  }
}
