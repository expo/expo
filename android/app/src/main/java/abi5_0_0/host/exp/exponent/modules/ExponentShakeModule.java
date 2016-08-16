// Copyright 2015-present 650 Industries. All rights reserved.

package abi5_0_0.host.exp.exponent.modules;

import android.content.Context;
import android.hardware.SensorManager;

import abi5_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi5_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi5_0_0.com.facebook.react.common.ShakeDetector;
import abi5_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;

import java.lang.ref.WeakReference;
import java.util.HashSet;
import java.util.Set;

import host.exp.exponent.ExponentApplication;

public class ExponentShakeModule extends ReactContextBaseJavaModule {

  public static void startListening(ExponentApplication application) {
    sShakeDetector = new ShakeDetector(new ShakeDetector.ShakeListener() {

      @Override
      public void onShake() {
        for (WeakReference<ExponentShakeModule> module : sModules) {
          if (module.get() != null) {
            module.get().onShake();
          }
        }
      }
    });
    sShakeDetector.start((SensorManager) application.getSystemService(Context.SENSOR_SERVICE));
  }

  private static ShakeDetector sShakeDetector;
  private static Set<WeakReference<ExponentShakeModule>> sModules = new HashSet<>();

  public ExponentShakeModule(ReactApplicationContext reactContext) {
    super(reactContext);

    sModules.add(new WeakReference(this));
  }

  @Override
  public String getName() {
    return "ExponentShake";
  }

  private void onShake() {
    getReactApplicationContext()
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("Exponent.shake", null);
  }

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();

    WeakReference<ExponentShakeModule> moduleToRemove = null;
    for (WeakReference<ExponentShakeModule> module : sModules) {
      if (module.get() == this) {
        moduleToRemove = module;
        break;
      }
    }

    if (moduleToRemove != null) {
      sModules.remove(moduleToRemove);
    }
  }
}
