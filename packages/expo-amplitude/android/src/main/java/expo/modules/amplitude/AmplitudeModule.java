// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.amplitude;

import android.content.Context;
import android.util.Log;

import com.amplitude.api.AmplitudeClient;

import java.lang.reflect.Field;
import java.util.Map;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;

public class AmplitudeModule extends ExportedModule implements ModuleRegistryConsumer {

  private Context mContext;
  private AmplitudeClient mClient;

  private static final String TAG = AmplitudeModule.class.getSimpleName();
  private static final String ERROR_CODE = "MISSING_CLIENT";
  private static final String ERROR_MESSAGE = "Client has not been initialized!";
  private ModuleRegistry mModuleRegistry;

  public AmplitudeModule(Context context) {
    super(context);
    mContext = context;
  }

  @Override
  public String getName() {
    return "ExponentAmplitude";
  }

  @ExpoMethod
  public void initialize(final String apiKey, final Promise promise) {
    resetAmplitudeDatabaseHelper();
    mClient = new AmplitudeClient();
    mClient.initialize(mContext, apiKey);
    promise.resolve(null);
  }

  @ExpoMethod
  public void setUserId(final String userId, final Promise promise) {
    if (mClient != null) {
      mClient.setUserId(userId);
      promise.resolve(null);
    } else {
      promise.reject(ERROR_CODE, ERROR_MESSAGE);
    }
  }

  @ExpoMethod
  public void setUserProperties(final Map<String, Object> properties, final Promise promise) {
    if (mClient != null) {
      mClient.setUserProperties(JsonUtils.MapToJson(properties));
      promise.resolve(null);
    } else {
      promise.reject(ERROR_CODE, ERROR_MESSAGE);
    }
  }

  @ExpoMethod
  public void clearUserProperties(final Promise promise) {
    if (mClient != null) {
      mClient.clearUserProperties();
      promise.resolve(null);
    } else {
      promise.reject(ERROR_CODE, ERROR_MESSAGE);
    }
  }

  @ExpoMethod
  public void logEvent(final String eventName, final Promise promise) {
    if (mClient != null) {
      mClient.logEvent(eventName);
      promise.resolve(null);
    } else {
      promise.reject(ERROR_CODE, ERROR_MESSAGE);
    }
  }

  @ExpoMethod
  public void logEventWithProperties(final String eventName, final Map<String, Object> properties, final Promise promise) {
    if (mClient != null) {
      mClient.logEvent(eventName, JsonUtils.MapToJson(properties));
      promise.resolve(null);
    } else {
      promise.reject(ERROR_CODE, ERROR_MESSAGE);
    }
  }

  @ExpoMethod
  public void setGroup(final String groupType, final Map<String, Object> groupNames, final Promise promise) {
    if (mClient != null) {
      mClient.setGroup(groupType, JsonUtils.MapToJson(groupNames));
      promise.resolve(null);
    } else {
      promise.reject(ERROR_CODE, ERROR_MESSAGE);
    }
  }

  protected void resetAmplitudeDatabaseHelper() {
    try {
      Field field = Class.forName("com.amplitude.api.DatabaseHelper").getDeclaredField("instance");
      field.setAccessible(true);
      field.set(null, null);
    } catch (Throwable e) {
      log(TAG, e.toString());
    }
  }

  protected void log(String tag, String msg) {
    Log.e(tag, msg);
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }
}
