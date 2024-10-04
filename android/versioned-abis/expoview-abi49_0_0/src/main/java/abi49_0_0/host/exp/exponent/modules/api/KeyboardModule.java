// Copyright 2015-present 650 Industries. All rights reserved.

package abi49_0_0.host.exp.exponent.modules.api;

import android.app.Activity;
import android.view.View;
import android.view.inputmethod.InputMethodManager;

import abi49_0_0.com.facebook.react.bridge.Promise;
import abi49_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi49_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi49_0_0.com.facebook.react.bridge.ReactMethod;

public class KeyboardModule extends ReactContextBaseJavaModule {
  public KeyboardModule(ReactApplicationContext context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExponentKeyboard";
  }

  @ReactMethod
  public void hideAsync(final Promise promise) {
    Boolean success = false;
    Activity activity = getCurrentActivity();
    if (activity != null) {
      InputMethodManager imm = (InputMethodManager) activity.getSystemService(Activity.INPUT_METHOD_SERVICE);
      View view = activity.getCurrentFocus();
      if (view != null) {
        imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
        success = true;
      }
    }
    promise.resolve(success);
  }
}
