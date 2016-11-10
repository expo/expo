// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel;

import com.facebook.react.bridge.WritableMap;

public interface ExponentKernelModuleInterface {

  void queueEvent(String name, WritableMap data, ExponentKernelModuleProvider.KernelEventCallback callback);
}
