// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.modules;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import javax.inject.Inject;

import host.exp.exponent.Constants;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.DevMenuManager;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.experience.ErrorActivity;
import host.exp.exponent.kernel.ExponentKernelModuleInterface;
import host.exp.exponent.kernel.ExponentKernelModuleProvider;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.utils.JSONBundleConverter;

public class ExponentKernelModule extends ReactContextBaseJavaModule implements ExponentKernelModuleInterface {

  private static final String TAG = ExponentKernelModule.class.getSimpleName();

  private static ExponentKernelModule sInstance;

  @Inject
  Kernel mKernel;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  ExponentNetwork mExponentNetwork;

  @Inject
  DevMenuManager mDevMenuManager;

  private static Map<String, ExponentKernelModuleProvider.KernelEventCallback> sKernelEventCallbacks = new HashMap<>();

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

  public static void queueEvent(String name, WritableMap data, ExponentKernelModuleProvider.KernelEventCallback callback) {
    queueEvent(new ExponentKernelModuleProvider.KernelEvent(name, data, callback));
  }

  public static void queueEvent(ExponentKernelModuleProvider.KernelEvent event) {
    ExponentKernelModuleProvider.sEventQueue.add(event);

    if (sInstance != null) {
      sInstance.consumeEventQueue();
    }
  }

  @Override
  public String getName() {
    return "ExponentKernel";
  }

  @Override
  public void consumeEventQueue() {
    if (ExponentKernelModuleProvider.sEventQueue.size() == 0) {
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

  //region Exported methods

  @ReactMethod
  public void getSessionAsync(Promise promise) {
    String sessionString = mExponentSharedPreferences.getString(ExponentSharedPreferences.EXPO_AUTH_SESSION);
    try {
      JSONObject sessionJsonObject = new JSONObject(sessionString);
      WritableMap session = Arguments.fromBundle(JSONBundleConverter.JSONToBundle(sessionJsonObject));
      promise.resolve(session);
    } catch (Exception e) {
      promise.resolve(null);
      EXL.e(TAG, e);
    }
  }

  @ReactMethod
  public void setSessionAsync(ReadableMap session, Promise promise) {
    try {
      JSONObject sessionJsonObject = new JSONObject(session.toHashMap());
      mExponentSharedPreferences.updateSession(sessionJsonObject);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject("ERR_SESSION_NOT_SAVED", "Could not save session secret", e);
      EXL.e(TAG, e);
    }
  }

  @ReactMethod
  public void removeSessionAsync(Promise promise) {
    try {
      mExponentSharedPreferences.removeSession();
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject("ERR_SESSION_NOT_REMOVED", "Could not remove session secret", e);
      EXL.e(TAG, e);
    }
  }

  @ReactMethod
  public void createShortcutAsync(String manifestUrl, ReadableMap manifest, String bundleUrl, Promise promise) {
    mKernel.installShortcut(manifestUrl, manifest, bundleUrl);

    promise.resolve(true);
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

  //region DevMenu

  @ReactMethod
  public void doesCurrentTaskEnableDevtoolsAsync(Promise promise) {
    promise.resolve(mDevMenuManager.isDevSupportEnabledByCurrentActivity());
  }

  @ReactMethod
  public void getIsOnboardingFinishedAsync(Promise promise) {
    promise.resolve(mDevMenuManager.isOnboardingFinished());
  }

  @ReactMethod
  public void setIsOnboardingFinishedAsync(boolean isOnboardingFinished, Promise promise) {
    mDevMenuManager.setIsOnboardingFinished(isOnboardingFinished);
    promise.resolve(null);
  }

  @ReactMethod
  public void closeDevMenuAsync(Promise promise) {
    mDevMenuManager.hideInCurrentActivity();
    promise.resolve(true);
  }

  @ReactMethod
  public void getDevMenuItemsToShowAsync(Promise promise) {
    WritableMap devMenuItems = mDevMenuManager.getMenuItems();
    promise.resolve(devMenuItems);
  }

  @ReactMethod
  public void selectDevMenuItemWithKeyAsync(String itemKey, Promise promise) {
    mDevMenuManager.selectItemWithKey(itemKey);
    mDevMenuManager.requestToClose();
    promise.resolve(true);
  }

  @ReactMethod
  public void reloadAppAsync(Promise promise) {
    mDevMenuManager.reloadApp();
    mDevMenuManager.requestToClose();
    promise.resolve(true);
  }

  @ReactMethod
  public void goToHomeAsync(Promise promise) {
    mKernel.openHomeActivity();
    mDevMenuManager.requestToClose();
    promise.resolve(true);
  }

  //endregion DevMenu
  //endregion Exported methods
}
