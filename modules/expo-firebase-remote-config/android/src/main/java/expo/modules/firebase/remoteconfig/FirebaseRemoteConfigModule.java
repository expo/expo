package expo.modules.firebase.remoteconfig;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.util.Log;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.FirebaseApp;
import com.google.firebase.remoteconfig.FirebaseRemoteConfig;
import com.google.firebase.remoteconfig.FirebaseRemoteConfigFetchThrottledException;
import com.google.firebase.remoteconfig.FirebaseRemoteConfigSettings;
import com.google.firebase.remoteconfig.FirebaseRemoteConfigValue;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityProvider;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.modules.firebase.app.Utils;

class FirebaseRemoteConfigModule extends ExportedModule implements ModuleRegistryConsumer {

  private static final String TAG = FirebaseRemoteConfigModule.class.getCanonicalName();

  private static final String STRING_VALUE = "stringValue";
  private static final String DATA_VALUE = "dataValue";
  private static final String BOOL_VALUE = "boolValue";
  private static final String NUMBER_VALUE = "numberValue";
  private static final String SOURCE = "source";

  private ModuleRegistry mModuleRegistry;
  private Context mContext;

  FirebaseRemoteConfigModule(Context context) {
    super(context);
    mContext = context;
    Log.d(TAG, "New instance");
  }

  @Override
  public String getName() {
    return "ExpoFirebaseRemoteConfig";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  protected final Context getApplicationContext() {
    return getCurrentActivity().getApplicationContext();
  }

  final Activity getCurrentActivity() {
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    return activityProvider.getCurrentActivity();
  }

  @ExpoMethod
  public void enableDeveloperMode(Promise promise) {
    if (FirebaseApp.getInstance() == null) {
      promise.reject("E_FIREBASE_REMOTE_CONFIG", "Default app is not initialized yet.");
      return;
    }
    FirebaseRemoteConfigSettings.Builder settings = new FirebaseRemoteConfigSettings.Builder();
    settings.setDeveloperModeEnabled(true);

    FirebaseRemoteConfig.getInstance().setConfigSettings(settings.build());
    promise.resolve(null);
  }

  @ExpoMethod
  public void fetch(final Promise promise) {
    fetchInternal(promise, false, 0);
  }

  @ExpoMethod
  public void fetchWithExpirationDuration(double expirationDuration, final Promise promise) {
    fetchInternal(promise, true, (long) expirationDuration);
  }

  @ExpoMethod
  public void activateFetched(final Promise promise) {
    if (FirebaseApp.getInstance() == null) {
      promise.reject("E_FIREBASE_REMOTE_CONFIG", "Default app is not initialized yet.");
      return;
    }
    Boolean status = FirebaseRemoteConfig.getInstance().activateFetched();
    promise.resolve(status);
  }

  @ExpoMethod
  public void getValue(String key, final Promise promise) {
    if (FirebaseApp.getInstance() == null) {
      promise.reject("E_FIREBASE_REMOTE_CONFIG", "Default app is not initialized yet.");
      return;
    }
    FirebaseRemoteConfigValue value = FirebaseRemoteConfig.getInstance().getValue(key);
    promise.resolve(convertRemoteConfigValue(value));
  }

  @ExpoMethod
  public void getValues(List keys, final Promise promise) {
    if (FirebaseApp.getInstance() == null) {
      promise.reject("E_FIREBASE_REMOTE_CONFIG", "Default app is not initialized yet.");
      return;
    }
    List<Bundle> array = new ArrayList<>();
    List<Object> keysList = Utils.recursivelyDeconstructReadableArray(keys);

    for (Object key : keysList) {
      FirebaseRemoteConfigValue value = FirebaseRemoteConfig.getInstance().getValue((String) key);
      array.add(convertRemoteConfigValue(value));
    }

    promise.resolve(array);
  }

  @ExpoMethod
  public void getKeysByPrefix(String prefix, final Promise promise) {
    if (FirebaseApp.getInstance() == null) {
      promise.reject("E_FIREBASE_REMOTE_CONFIG", "Default app is not initialized yet.");
      return;
    }
    Set<String> keys = FirebaseRemoteConfig.getInstance().getKeysByPrefix(prefix);
    List<String> array = new ArrayList();

    for (String key : keys) {
      array.add(key);
    }

    promise.resolve(array);
  }

  @ExpoMethod
  public void setDefaults(Map<String, Object> map, Promise promise) {
    if (FirebaseApp.getInstance() == null) {
      promise.reject("E_FIREBASE_REMOTE_CONFIG", "Default app is not initialized yet.");
      return;
    }
    // TODO: Evan: Possibly clone
    Map<String, Object> convertedMap = map;
    FirebaseRemoteConfig.getInstance().setDefaults(convertedMap);
    promise.resolve(null);
  }

  @ExpoMethod
  public void setDefaultsFromResource(int resourceId, Promise promise) {
    if (FirebaseApp.getInstance() == null) {
      promise.reject("E_FIREBASE_REMOTE_CONFIG", "Default app is not initialized yet.");
      return;
    }
    FirebaseRemoteConfig.getInstance().setDefaults(resourceId);
    promise.resolve(null);
  }

  private void fetchInternal(final Promise promise, Boolean withExpiration, long expirationDuration) {
    if (FirebaseApp.getInstance() == null) {
      promise.reject("E_FIREBASE_REMOTE_CONFIG", "Default app is not initialized yet.");
      return;
    }
    FirebaseRemoteConfig.getInstance().fetch(withExpiration ? expirationDuration : 43200) // 12 hours default
        .addOnCompleteListener(new OnCompleteListener<Void>() {
          @Override
          public void onComplete(@NonNull Task<Void> task) {
            if (task.isSuccessful()) {
              promise.resolve(null);
            } else {
              if (task.getException() instanceof FirebaseRemoteConfigFetchThrottledException) {
                promise.reject("config/throttled",
                    "fetch() operation cannot be completed successfully, due to throttling.", task.getException());
              } else {
                promise.reject("config/failure", "fetch() operation cannot be completed successfully.",
                    task.getException());
              }
            }
          }
        });
  }

  private Bundle convertRemoteConfigValue(FirebaseRemoteConfigValue value) {
    Bundle map = new Bundle();

    map.putString(STRING_VALUE, value.asString());

    try {
      map.putString(DATA_VALUE, new String(value.asByteArray()));
    } catch (Exception e) {
      map.remove(DATA_VALUE);
    }

    Boolean booleanValue;
    try {
      booleanValue = value.asBoolean();
      map.putBoolean(BOOL_VALUE, booleanValue);
    } catch (Exception e) {
      map.remove(BOOL_VALUE);
    }

    Double numberValue;
    try {
      numberValue = value.asDouble();
      map.putDouble(NUMBER_VALUE, numberValue);
    } catch (Exception e) {
      map.remove(NUMBER_VALUE);
    }

    switch (value.getSource()) {
    case FirebaseRemoteConfig.VALUE_SOURCE_DEFAULT:
      map.putString(SOURCE, "default");
      break;
    case FirebaseRemoteConfig.VALUE_SOURCE_REMOTE:
      map.putString(SOURCE, "remote");
      break;
    default:
      map.putString(SOURCE, "static");
    }

    return map;
  }

}
