// Copyright 2015-present 650 Industries. All rights reserved.

package abi30_0_0.host.exp.exponent.modules.internal;

import abi30_0_0.com.facebook.react.bridge.Callback;
import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi30_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi30_0_0.com.facebook.react.bridge.ReactMethod;
import abi30_0_0.com.facebook.react.bridge.ReadableArray;
import host.exp.exponent.kernel.KernelProvider;

public class ExponentUnsignedAsyncStorageModule extends ReactContextBaseJavaModule {

  private static final String ERROR_MESSAGE = "Can't use AsyncStorage in unsigned Experience.";

  public ExponentUnsignedAsyncStorageModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "AsyncSQLiteDBStorage";
  }

  @Override
  public boolean canOverrideExistingModule() {
    return true;
  }

  @ReactMethod
  public void multiGet(final ReadableArray keys, final Callback callback) {
    KernelProvider.getInstance().handleError(ERROR_MESSAGE);
  }

  @ReactMethod
  public void multiSet(final ReadableArray keyValueArray, final Callback callback) {
    KernelProvider.getInstance().handleError(ERROR_MESSAGE);
  }

  @ReactMethod
  public void multiRemove(final ReadableArray keys, final Callback callback) {
    KernelProvider.getInstance().handleError(ERROR_MESSAGE);
  }

  @ReactMethod
  public void multiMerge(final ReadableArray keyValueArray, final Callback callback) {
    KernelProvider.getInstance().handleError(ERROR_MESSAGE);
  }

  @ReactMethod
  public void clear(final Callback callback) {
    KernelProvider.getInstance().handleError(ERROR_MESSAGE);
  }

  @ReactMethod
  public void getAllKeys(final Callback callback) {
    KernelProvider.getInstance().handleError(ERROR_MESSAGE);
  }
}
