// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel;

public class KernelProvider {

  private static KernelInterface sInstance;

  public static void setInstance(KernelInterface instance) {
    sInstance = instance;
  }

  public static KernelInterface getInstance() {
    if (sInstance == null) {
      sInstance = ExponentViewKernel.getInstance();
    }

    return sInstance;
  }
}
