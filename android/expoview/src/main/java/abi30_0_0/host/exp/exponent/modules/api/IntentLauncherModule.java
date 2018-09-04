package abi30_0_0.host.exp.exponent.modules.api;

import android.app.Activity;
import android.content.Intent;
import android.support.annotation.Nullable;
import android.net.Uri;

import abi30_0_0.com.facebook.react.bridge.Arguments;
import abi30_0_0.com.facebook.react.bridge.LifecycleEventListener;
import abi30_0_0.com.facebook.react.bridge.Promise;
import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi30_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi30_0_0.com.facebook.react.bridge.ReactMethod;
import abi30_0_0.com.facebook.react.bridge.ReadableMap;

public class IntentLauncherModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  private Promise pendingPromise;

  public IntentLauncherModule(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return "ExponentIntentLauncher";
  }


  @ReactMethod
  public void startActivity(String activity, @Nullable ReadableMap data, @Nullable String uri, Promise promise) {
    if (pendingPromise != null) {
      pendingPromise.reject("ERR_INTERRUPTED", "A new activity was started");
      pendingPromise = null;
    }

    if (activity == null || activity.isEmpty()) {
      promise.reject("ERR_EMPTY_ACTIVITY", "Specified activity was empty");
      return;
    }

    try {
      Activity currentActivity = getCurrentActivity();
      Intent intent = new Intent(activity);

      if (data != null) {
        intent.putExtras(Arguments.toBundle(data));
      }

      if (uri != null && !uri.isEmpty()) {
        intent.setData(Uri.parse(uri));
      }

      if (currentActivity != null) {
        currentActivity.startActivity(intent);
      } else {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getReactApplicationContext().startActivity(intent);
      }

      pendingPromise = promise;
    } catch (Exception e) {
      promise.reject("ERR_LAUNCHING_ACTIVITY", e);
    }
  }

  private void onReturn() {
    if (pendingPromise != null) {
      pendingPromise.resolve(true);
      pendingPromise = null;
    }
  }

  @Override
  public void onHostPause() {
  }

  @Override
  public void onHostResume() {
    onReturn();
  }

  @Override
  public void onHostDestroy() {
  }
}
