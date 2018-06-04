// Copyright 2015-present 650 Industries. All rights reserved.

package abi28_0_0.host.exp.exponent.modules.api;

import android.content.Context;
import android.hardware.SensorManager;

import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi28_0_0.com.facebook.react.common.ShakeDetector;
import abi28_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;

import host.exp.exponent.analytics.EXL;

public class ShakeModule extends ReactContextBaseJavaModule {
  private static final String TAG = ShakeModule.class.getSimpleName();

  private ShakeDetector mShakeDetector;

  public ShakeModule(ReactApplicationContext reactContext) {
    super(reactContext);

    mShakeDetector = new ShakeDetector(new ShakeDetector.ShakeListener() {
      @Override
      public void onShake() {
        ShakeModule.this.onShake();
      }
    });
    mShakeDetector.start((SensorManager) reactContext.getSystemService(Context.SENSOR_SERVICE));
  }

  @Override
  public String getName() {
    return "ExponentShake";
  }

  private void onShake() {
    try {
      getReactApplicationContext()
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit("Exponent.shake", null);
    } catch (Throwable e) {
      EXL.e(TAG, e);
    }
  }

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();
    mShakeDetector.stop();
  }
}
