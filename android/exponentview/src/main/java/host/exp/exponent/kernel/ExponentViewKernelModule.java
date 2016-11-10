// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;

public class ExponentViewKernelModule implements ExponentKernelModuleInterface {

  public ExponentViewKernelModule(ReactContext reactContext) {

  }

  @Override
  public void queueEvent(String name, WritableMap data, ExponentKernelModuleProvider.KernelEventCallback callback) {
    // TODO
  }
}
