// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel;


public class KernelProvider {

  public interface KernelFactory {
    KernelInterface create();
  }

  private static KernelFactory sFactory = new KernelFactory() {
    @Override
    public KernelInterface create() {
      return ExpoViewKernel.getInstance();
    }
  };
  private static KernelInterface sInstance;

  public static void setFactory(KernelFactory factory) {
    sFactory = factory;
  }

  public static KernelInterface getInstance() {
    if (sInstance == null) {
      sInstance = sFactory.create();
    }

    return sInstance;
  }
}
