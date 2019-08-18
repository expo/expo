// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.kernel;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import java.util.LinkedList;
import java.util.Queue;

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
      return new ExpoViewKernelModule(reactContext);
    }
  };
  private static ExponentKernelModuleInterface sInstance;

  public static void setFactory(ExponentKernelModuleFactory factory) {
    sFactory = factory;
  }

  public static ExponentKernelModuleInterface newInstance(ReactApplicationContext reactContext) {
    sInstance = sFactory.create(reactContext);
    return sInstance;
  }

  public static class KernelEvent {
    public final String name;
    public final WritableMap data;
    public final KernelEventCallback callback;

    public KernelEvent(String name, WritableMap data, KernelEventCallback callback) {
      this.name = name;
      this.data = data;
      this.callback = callback;
    }
  }


  public static Queue<KernelEvent> sEventQueue = new LinkedList<>();

  public static void queueEvent(String name, WritableMap data, ExponentKernelModuleProvider.KernelEventCallback callback) {
    queueEvent(new ExponentKernelModuleProvider.KernelEvent(name, data, callback));
  }

  public static void queueEvent(ExponentKernelModuleProvider.KernelEvent event) {
    sEventQueue.add(event);

    if (sInstance != null) {
      sInstance.consumeEventQueue();
    }
  }
}
