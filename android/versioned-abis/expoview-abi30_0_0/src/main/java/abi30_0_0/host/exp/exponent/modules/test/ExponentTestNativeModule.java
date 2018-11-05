// Copyright 2015-present 650 Industries. All rights reserved.

package abi30_0_0.host.exp.exponent.modules.test;

import android.util.Log;

import abi30_0_0.com.facebook.react.bridge.Promise;
import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi30_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi30_0_0.com.facebook.react.bridge.ReactMethod;
import abi30_0_0.com.facebook.react.bridge.ReadableMap;

import java.util.HashMap;
import java.util.Map;

import de.greenrobot.event.EventBus;
import host.exp.exponent.kernel.KernelConfig;
import host.exp.exponent.test.TestCompletedEvent;
import host.exp.exponent.test.TestActionEvent;
import host.exp.exponent.test.TestResolvePromiseEvent;

public class ExponentTestNativeModule extends ReactContextBaseJavaModule {

  private static final String TAG = ExponentTestNativeModule.class.getSimpleName();

  public ExponentTestNativeModule(ReactApplicationContext reactContext) {
    super(reactContext);

    EventBus.getDefault().register(this);
  }

  @Override
  public String getName() {
    return "ExponentTest";
  }

  private int mCurrentId = 0;
  private Map<Integer, Promise> mIdToPromise = new HashMap<>();

  private int getPromiseId(final Promise promise) {
    int id = mCurrentId++;
    mIdToPromise.put(id, promise);
    return id;
  }

  public void onEvent(final TestResolvePromiseEvent event) {
    if (mIdToPromise.containsKey(event.id)) {
      mIdToPromise.get(event.id).resolve(true);
      mIdToPromise.remove(event.id);
    }
  }

  @ReactMethod
  public void action(final ReadableMap options, final Promise promise) {
    if (!KernelConfig.IS_TEST) {
      promise.resolve(true);
    }

    String selectorType = options.getString("selectorType");
    String selectorValue = null;
    if (options.hasKey("selectorValue")) {
      selectorValue = options.getString("selectorValue");
    }

    String actionType = options.getString("actionType");
    String actionValue = null;
    if (options.hasKey("actionValue")) {
      actionValue = options.getString("actionValue");
    }

    int timeout = 0;
    if (options.hasKey("timeout")) {
      timeout = options.getInt("timeout");
    }

    int delay = 0;
    if (options.hasKey("delay")) {
      delay = options.getInt("delay");
    }

    EventBus.getDefault().post(new TestActionEvent(getPromiseId(promise), selectorType, selectorValue, actionType, actionValue, delay, timeout));
  }

  @ReactMethod
  public void completed(final String stringifiedJson, final Promise promise) {
    if (!KernelConfig.IS_TEST) {
      promise.resolve(true);
    }

    EventBus.getDefault().post(new TestCompletedEvent(getPromiseId(promise), stringifiedJson));
  }
}
