// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;

public class ExponentKernelModuleProvider {

  public interface KernelEventCallback {
    void onEventSuccess(ReadableMap result);

    void onEventFailure(String errorMessage);
  }

  public interface ExponentKernelModuleFactory {
    ExponentKernelModuleInterface create(ReactApplicationContext reactContext);
  }

  private static ExponentKernelModuleFactory sFactory = new ExponentKernelModuleFactory() {
    @Override
    public ExponentKernelModuleInterface create(ReactApplicationContext reactContext) {
      return new ExponentViewKernelModule(reactContext);
    }
  };
  private static ExponentKernelModuleInterface sInstance;

  public static void setFactory(ExponentKernelModuleFactory factory) {
    sFactory = factory;
  }

  public static ExponentKernelModuleInterface newInstance(ReactApplicationContext reactContext) {
    return sFactory.create(reactContext);
  }

  public static ExponentKernelModuleInterface getInstance() {
    return sInstance;
  }

}
