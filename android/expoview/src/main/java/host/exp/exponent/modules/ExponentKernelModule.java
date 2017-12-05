// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.modules;

import android.app.Activity;
import android.content.Context;
import android.support.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import javax.inject.Inject;

import host.exp.exponent.Constants;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.experience.ErrorActivity;
import host.exp.exponent.experience.ExperienceActivity;
import host.exp.exponent.kernel.ExponentError;
import host.exp.exponent.kernel.ExponentKernelModuleInterface;
import host.exp.exponent.kernel.ExponentKernelModuleProvider;
import host.exp.exponent.kernel.ExponentUrls;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.storage.ExponentSharedPreferences;
import expolib_v1.okhttp3.Call;
import expolib_v1.okhttp3.Callback;
import expolib_v1.okhttp3.Request;
import expolib_v1.okhttp3.Response;

public class ExponentKernelModule extends ReactContextBaseJavaModule implements ExponentKernelModuleInterface {

  private static final String TAG = ExponentKernelModule.class.getSimpleName();

  private static ExponentKernelModule sInstance;

  @Inject
  Context mContext;

  @Inject
  Kernel mKernel;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  ExponentNetwork mExponentNetwork;

  private static Map<String, ExponentKernelModuleProvider.KernelEventCallback> sKernelEventCallbacks = new HashMap<>();
  private boolean mIsLoaded = false;

  public ExponentKernelModule(ReactApplicationContext reactContext) {
    super(reactContext);
    NativeModuleDepsProvider.getInstance().inject(ExponentKernelModule.class, this);

    sInstance = this;
  }

  @Nullable
  @Override
  public Map<String, Object> getConstants() {
    Map<String, Object> constants = MapBuilder.<String, Object>of(
        "sdkVersions", Constants.SDK_VERSIONS
    );
    return constants;
  }

  public static void addError(ExponentError error) {
    WritableArray stackArray = null;
    if (error.stack != null) {
      stackArray = Arguments.fromArray(error.stack);
    }

    try {
      WritableMap params = Arguments.createMap();
      params.putString("errorMessage", error.errorMessage.developerErrorMessage());
      params.putArray("stack", stackArray);
      params.putInt("exceptionId", error.exceptionId);
      params.putBoolean("isFatal", error.isFatal);

      queueEvent("ExponentKernel.addError", params, null);
    } catch (Throwable e) {
      EXL.e(TAG, e);
    }
  }

  public static void queueEvent(String name, WritableMap data, ExponentKernelModuleProvider.KernelEventCallback callback) {
    queueEvent(new ExponentKernelModuleProvider.KernelEvent(name, data, callback));
  }

  public static void queueEvent(ExponentKernelModuleProvider.KernelEvent event) {
    ExponentKernelModuleProvider.sEventQueue.add(event);

    if (sInstance != null) {
      sInstance.consumeEventQueue();
    }
  }

  public static boolean isLoaded() {
    return sInstance != null && sInstance.mIsLoaded;
  }

  @Override
  public String getName() {
    return "ExponentKernel";
  }

  @Override
  public void consumeEventQueue() {
    if (!mIsLoaded || ExponentKernelModuleProvider.sEventQueue.size() == 0) {
      return;
    }

    ExponentKernelModuleProvider.KernelEvent event = ExponentKernelModuleProvider.sEventQueue.remove();

    String eventId = UUID.randomUUID().toString();
    event.data.putString("eventId", eventId);

    if (event.callback != null) {
      sKernelEventCallbacks.put(eventId, event.callback);
    }

    getReactApplicationContext()
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(event.name, event.data);

    consumeEventQueue();
  }

  @ReactMethod
  public void onLoaded() {
    mIsLoaded = true;
    consumeEventQueue();
  }

  @ReactMethod
  public void createShortcutAsync(String manifestUrl, ReadableMap manifest, String bundleUrl, Promise promise) {
    mKernel.installShortcut(manifestUrl, manifest, bundleUrl);

    promise.resolve(true);
  }

  @ReactMethod
  public void addDevMenu() {
    mKernel.addDevMenu();
  }

  @ReactMethod
  public void goToHomeFromErrorScreen() {
    ErrorActivity visibleActivity = ErrorActivity.getVisibleActivity();
    if (visibleActivity == null) {
      // shouldn't ever get here
      EXL.e(TAG, "visibleActivity was null in goToHomeFromErrorScreen");
      return;
    }

    visibleActivity.onClickHome();
  }

  @ReactMethod
  public void reloadFromErrorScreen() {
    ErrorActivity visibleActivity = ErrorActivity.getVisibleActivity();
    if (visibleActivity == null) {
      // shouldn't ever get here
      EXL.e(TAG, "visibleActivity was null in reloadFromErrorScreen");
      return;
    }

    visibleActivity.onClickReload();
  }

  @ReactMethod
  public void onEventSuccess(String eventId, ReadableMap result) {
    if (!sKernelEventCallbacks.containsKey(eventId)) {
      return;
    }

    ExponentKernelModuleProvider.KernelEventCallback callback = sKernelEventCallbacks.remove(eventId);
    callback.onEventSuccess(result);
  }

  @ReactMethod
  public void onEventFailure(String eventId, String errorMessage) {
    if (!sKernelEventCallbacks.containsKey(eventId)) {
      return;
    }

    ExponentKernelModuleProvider.KernelEventCallback callback = sKernelEventCallbacks.remove(eventId);
    callback.onEventFailure(errorMessage);
  }

  @ReactMethod
  public void dismissNuxAsync(Promise promise) {
    Activity kernelActivityContext = mKernel.getActivityContext();
    if (kernelActivityContext instanceof ExperienceActivity) {
      ExperienceActivity currentExperienceActivity = (ExperienceActivity) kernelActivityContext;
      currentExperienceActivity.dismissNuxViewIfVisible(false);
    }
    promise.resolve(true);
  }

  @ReactMethod
  public void clearExperienceData(String experienceId, String manifestUrl) {
    ClearExperienceData.clear(mContext, experienceId, manifestUrl);
    mKernel.reloadVisibleExperience(manifestUrl);
  }

  @ReactMethod
  public void preloadBundleUrlAsync(final String url, final Promise promise) {
    preloadRequestAsync(ExponentUrls.addExponentHeadersToUrl(url, false, false).build(), promise);
  }

  private void preloadRequestAsync(final Request request, final Promise promise) {
    mExponentNetwork.getClient().call(request, new Callback() {
      @Override
      public void onFailure(Call call, IOException e) {
        promise.reject(e);
      }

      @Override
      public void onResponse(Call call, Response response) throws IOException {
        ExponentNetwork.flushResponse(response);
        promise.resolve(true);
      }
    });
  }
}
