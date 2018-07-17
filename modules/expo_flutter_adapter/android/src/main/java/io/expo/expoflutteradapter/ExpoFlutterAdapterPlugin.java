package io.expo.expoflutteradapter;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.view.View;

import expo.core.*;
import expo.core.interfaces.LifecycleEventListener;
import expo.core.interfaces.Package;
import expo.core.interfaces.InternalModule;
import expo.core.interfaces.services.EventEmitter;
import expo.core.interfaces.services.UIManager;
import expo.interfaces.permissions.PermissionsListener;
import expo.interfaces.permissions.PermissionsManager;
import io.flutter.plugin.common.ActivityLifecycleListener;
import io.flutter.plugin.common.EventChannel;
import io.flutter.plugin.common.MethodCall;
import io.flutter.plugin.common.MethodChannel;
import io.flutter.plugin.common.MethodChannel.MethodCallHandler;
import io.flutter.plugin.common.MethodChannel.Result;

import io.flutter.plugin.common.PluginRegistry;
import io.flutter.view.FlutterNativeView;
import io.flutter.view.FlutterView;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.*;

import io.flutter.plugin.common.PluginRegistry.Registrar;

// Flutter plugin entry point
public class ExpoFlutterAdapterPlugin {
  private static Registrar sRegistrar;

  public static void registerWith(Registrar registrar) {
    sRegistrar = registrar;
  }

  public static void addPackages(List<Package> packages) {
    ExpoFlutterAdapterModule.addPackages(packages);
  }

  public static void addPackage(Package pkg) {
    ExpoFlutterAdapterModule.addPackage(pkg);
  }

  public static void initialize() {
    // Just create an instance of the module. We don't need to hold a reference to it anywhere --
    // it'll register itself to the `FlutterView` etc. to maintain its lifetime.
    new ExpoFlutterAdapterModule(sRegistrar);
  }
}

// Utility for conversion of data between Expo module and Flutter types
class Convert {
  static Object toFlutter(Object value) {
    if (value instanceof Bundle) {
      Bundle bundle = (Bundle) value;
      HashMap<String, Object> map = new HashMap<>();
      for (String key : bundle.keySet()) {
        map.put(key, toFlutter(bundle.get(key)));
      }
      return map;
    } else {
      return value;
    }
  }
}

// The actual adapter. Implements a bunch of Flutter interfaces to provide Expo module interfaces.
class ExpoFlutterAdapterModule implements
    // Flutter interfaces
    PluginRegistry.ViewDestroyListener, PluginRegistry.UserLeaveHintListener,
    ActivityLifecycleListener, PluginRegistry.RequestPermissionsResultListener,
    EventChannel.StreamHandler, MethodCallHandler,

    // Expo module interfaces
    InternalModule, EventEmitter, UIManager, PermissionsManager {
  private Activity mActivity;
  private FlutterView mFlutterView;

  private ModuleRegistry mModuleRegistry;

  private static List<Package> sInitialPackages = new ArrayList<>();

  ExpoFlutterAdapterModule(Registrar registrar) {
    mActivity = registrar.activity();
    mFlutterView = registrar.view();

    // Hook up all the Flutter things
    registrar.addViewDestroyListener(this);
    registrar.addUserLeaveHintListener(this);
    mFlutterView.addActivityLifecycleListener(this);
    registrar.addRequestPermissionsResultListener(this);
    new MethodChannel(mFlutterView, "flutter_adapter.expo.io/method_calls")
        .setMethodCallHandler(this);
    new EventChannel(mFlutterView, "flutter_adapter.expo.io/events")
        .setStreamHandler(this);

    // Initialize Expo module registry, providing self as a module
    final InternalModule self = this;
    List<Package> packages = new ArrayList<>(sInitialPackages);
    packages.add(new Package() {
      @Override
      public List<InternalModule> createInternalModules(Context context) {
        return Collections.<InternalModule>singletonList(self);
      }

      @Override
      public List<ExportedModule> createExportedModules(Context context) {
        return Collections.emptyList();
      }

      @Override
      public List<ViewManager> createViewManagers(Context context) {
        return Collections.emptyList();
      }
    });
    mModuleRegistry = new ModuleRegistryProvider(packages).get(mFlutterView.getContext());
    mModuleRegistry.initialize();
  }

  public static void addPackages(List<Package> packages) {
    sInitialPackages.addAll(packages);
  }

  public static void addPackage(Package pkg) {
    sInitialPackages.add(pkg);
  }


  // List Expo module interfaces we provide
  @Override
  public List<Class> getExportedInterfaces() {
    return Arrays.<Class>asList(
        EventEmitter.class,
        UIManager.class,
        PermissionsManager.class
    );
  }


  // Forward method calls

  @Override
  public void onMethodCall(MethodCall call, final Result result) {
    switch (call.method) {
      case "callMethod":
        try {
          // Extract arguments
          String moduleName = call.argument("moduleName");
          String methodName = call.argument("methodName");
          List<Object> arguments = call.argument("arguments");

          // Add `Promise` argument for response -- wraps Flutter's `Result`
          arguments.add(new Promise() {
            @Override
            public void resolve(Object value) {
              result.success(Convert.toFlutter(value));
            }

            @Override
            public void reject(String code, String message, Throwable e) {
              StringWriter sw = new StringWriter();
              PrintWriter pw = new PrintWriter(sw);
              e.printStackTrace(pw);
              result.error("EXPO_MODULE_ERROR", message, sw.toString());
            }
          });

          // Call!
          ExportedModule module = mModuleRegistry.getExportedModule(moduleName);
          if (module == null) {
            throw new RuntimeException("Module '" + moduleName + "' not found. Please make sure" +
                " it is compiled and packaged in the native project.");
          }
          module.getExportedMethodInfos();
          module.invokeExportedMethod(methodName, arguments);
        } catch (Exception e) {
          StringWriter sw = new StringWriter();
          PrintWriter pw = new PrintWriter(sw);
          e.printStackTrace(pw);
          result.error("EXPO_MODULE_ERROR", e.getMessage(), sw.toString());
        }
        break;

      case "getConstant":
        try {
          // Extract arguments
          String moduleName = call.argument("moduleName");
          String constantName = call.argument("constantName");

          // Find and return constant
          ExportedModule module = mModuleRegistry.getExportedModule(moduleName);
          if (module == null) {
            throw new RuntimeException("Module '" + moduleName + "' not found. Please make sure" +
                " it is compiled and packaged in the native project.");
          }
          result.success(module.getConstants().get(constantName));
        } catch (Exception e) {
          StringWriter sw = new StringWriter();
          PrintWriter pw = new PrintWriter(sw);
          e.printStackTrace(pw);
          result.error("EXPO_MODULE_ERROR", e.getMessage(), sw.toString());
        }
    }
  }


  // Provide `EventEmitter`

  private EventChannel.EventSink mSink = null;

  @Override
  public void onListen(Object o, EventChannel.EventSink eventSink) {
    mSink = eventSink;
  }

  @Override
  public void onCancel(Object o) {
    mSink = null;
  }

  @Override
  public void emit(String eventName, Bundle eventBody) {
    if (mSink != null) {
      Map<String, Object> map = new HashMap<>();
      map.put("eventName", eventName);
      map.put("body", Convert.toFlutter(eventBody));
      mSink.success(map);
    }
  }

  @Override
  public void emit(final int viewId, final Event event) {
  }


  // Provide `PermissionsManager`

  private PermissionsListener mPermissionsListener;

  @Override
  @TargetApi(Build.VERSION_CODES.M)
  public boolean requestPermissions(
      String[] permissions,
      int requestCode,
      PermissionsListener listener) {
    mPermissionsListener = listener;
    mActivity.requestPermissions(permissions, requestCode);
    return true;
  }

  @Override
  public boolean onRequestPermissionsResult(
      final int requestCode,
      final String[] permissions,
      final int[] grantResults) {
    mPermissionsListener.onPermissionResult(permissions, grantResults);
    return true;
  }


  // Provide `UIManager`

  private HashSet<LifecycleEventListener> mLifeCycleEventListeners = new HashSet<>();

  @Override
  public void registerLifecycleEventListener(LifecycleEventListener listener) {
    mLifeCycleEventListeners.add(listener);
  }

  @Override
  public void unregisterLifecycleEventListener(LifecycleEventListener listener) {
    mLifeCycleEventListeners.remove(listener);
  }

  @Override
  public void onPostResume() {
    for (LifecycleEventListener listener : mLifeCycleEventListeners) {
      listener.onHostResume();
    }
  }

  @Override
  public void onUserLeaveHint() {
    for (LifecycleEventListener listener : mLifeCycleEventListeners) {
      listener.onHostPause();
    }
  }

  @Override
  public boolean onViewDestroy(FlutterNativeView flutterNativeView) {
    for (LifecycleEventListener listener : mLifeCycleEventListeners) {
      listener.onHostDestroy();
    }
    return false;
  }

  @Override
  public void runOnClientCodeQueueThread(Runnable runnable) {
    throw new UnsupportedOperationException("Unimplemented!");
  }

  @Override
  public void runOnUiQueueThread(Runnable runnable) {
    throw new UnsupportedOperationException("Unimplemented!");
  }

  @Override
  public <T extends View> void addUIBlock(int viewTag, UIBlock<T> block) {
    throw new UnsupportedOperationException("Unimplemented!");
  }
}

