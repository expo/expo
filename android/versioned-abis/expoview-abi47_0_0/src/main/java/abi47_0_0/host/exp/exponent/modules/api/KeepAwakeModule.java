// Copyright 2015-present 650 Industries. All rights reserved.

package abi47_0_0.host.exp.exponent.modules.api;

import android.app.Activity;
import android.view.WindowManager;

import abi47_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi47_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi47_0_0.com.facebook.react.bridge.ReactMethod;

public class KeepAwakeModule extends ReactContextBaseJavaModule {
  private boolean mIsActivated = false;

  public KeepAwakeModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ExponentKeepAwake";
  }

  @ReactMethod
  public void activate() {
    final Activity activity = getCurrentActivity();

    if (activity != null) {
      activity.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
          mIsActivated = true;
        }
      });
    }
  }

  @ReactMethod
  public void deactivate() {
    final Activity activity = getCurrentActivity();

    if (activity != null) {
      activity.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          mIsActivated = false;
          activity.getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }
      });
    }
  }

  public boolean isActivated() {
    return mIsActivated;
  }
}