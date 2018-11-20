package expo.modules.firebase.app;

import android.app.Activity;
import android.content.Context;
import android.content.IntentSender;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.util.Log;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityProvider;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;

// play services

@SuppressWarnings("WeakerAccess")
public class FirebaseAppModule extends ExportedModule implements ModuleRegistryConsumer {

  private ModuleRegistry mModuleRegistry;
  private Context mContext;

  private static final String TAG = FirebaseAppModule.class.getCanonicalName();

  public FirebaseAppModule(Context context) {
    super(context);
    this.mContext = context;
  }

  @Override
  public String getName() {
    return "ExpoFirebaseApp";
  }


  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  /**
   * Subclasses can use this method to access catalyst context passed as a constructor
   */
  protected final Context getApplicationContext() {
    return getCurrentActivity().getApplicationContext();
  }

  /**
   * Get the activity to which this context is currently attached, or {@code null} if not attached.
   *
   * DO NOT HOLD LONG-LIVED REFERENCES TO THE OBJECT RETURNED BY THIS METHOD, AS THIS WILL CAUSE
   * MEMORY LEAKS.
   *
   * For example, never store the value returned by this method in a member variable. Instead, call
   * this method whenever you actually need the Activity and make sure to check for {@code null}.
   */
  protected @Nullable
  final Activity getCurrentActivity() {
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    return activityProvider.getCurrentActivity();
  }

  private FirebaseApp getAppWithName(String appName) {
    List<FirebaseApp> firebaseAppList = FirebaseApp.getApps(getApplicationContext());
    for (FirebaseApp app : firebaseAppList) {
      if (app.getName().equals(appName)) {
        return app;
      }
    }
    return null;
  }

  @ExpoMethod
  public void initializeApp(String appName, final Map<String, String> options, Promise promise) {
    FirebaseOptions.Builder builder = new FirebaseOptions.Builder();

    builder.setApiKey(options.get("apiKey"));
    builder.setApplicationId(options.get("appId"));
    builder.setProjectId(options.get("projectId"));
    builder.setDatabaseUrl(options.get("databaseURL"));
    builder.setStorageBucket(options.get("storageBucket"));
    builder.setGcmSenderId(options.get("messagingSenderId"));
    // todo firebase sdk has no client id setter

    builder.setGaTrackingId(options.get("trackingId"));

    FirebaseApp firebaseApp = getAppWithName(appName);

    Bundle response = new Bundle();
    response.putString("result", "success");

    if (firebaseApp != null) {
      FirebaseOptions currentOptions = firebaseApp.getOptions();
      if (!currentOptions.getApiKey().equals(options.get("apiKey")) ||
          !currentOptions.getApplicationId().equals(options.get("appId"))) {
        firebaseApp.delete();
      } else {
        promise.resolve(response);
        return;
      }
    }

    if (appName == null || appName == "" || appName == "[DEFAULT]" || appName == "__FIRAPP_DEFAULT") {
      FirebaseApp.initializeApp(mContext, builder.build());
    } else {
      FirebaseApp.initializeApp(mContext, builder.build(), appName);
    }


    promise.resolve(response);
  }

  @ExpoMethod
  public void deleteApp(String appName, Promise promise) {
    FirebaseApp firebaseApp = FirebaseApp.getInstance(appName);

    if (firebaseApp != null) {
      firebaseApp.delete();
    }
    promise.resolve(null);
  }

  /**
   * @return
   */
  private Bundle getPlayServicesStatus() {
    GoogleApiAvailability gapi = GoogleApiAvailability.getInstance();
    final int status = gapi.isGooglePlayServicesAvailable(getApplicationContext());
    Bundle result = new Bundle();

    result.putInt("status", status);
    if (status == ConnectionResult.SUCCESS) {
      result.putBoolean("isAvailable", true);
    } else {
      result.putBoolean("isAvailable", false);
      result.putString("error", gapi.getErrorString(status));
      result.putBoolean("isUserResolvableError", gapi.isUserResolvableError(status));
      result.putBoolean("hasResolution", new ConnectionResult(status).hasResolution());
    }
    return result;
  }

  /**
   * Prompt the device user to update play services
   */
  @ExpoMethod
  public void promptForPlayServices(final Promise promise) {
    GoogleApiAvailability gapi = GoogleApiAvailability.getInstance();
    int status = gapi.isGooglePlayServicesAvailable(getApplicationContext());

    if (status != ConnectionResult.SUCCESS && gapi.isUserResolvableError(status)) {
      Activity activity = getCurrentActivity();
      if (activity != null) {
        gapi.getErrorDialog(activity, status, status).show();
      }
    }
    promise.resolve(null);
  }

  /**
   * Prompt the device user to update play services
   */
  @ExpoMethod
  public void resolutionForPlayServices(final Promise promise) {
    int status = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(getApplicationContext());
    ConnectionResult connectionResult = new ConnectionResult(status);

    if (!connectionResult.isSuccess() && connectionResult.hasResolution()) {
      Activity activity = getCurrentActivity();
      if (activity != null) {
        try {
          connectionResult.startResolutionForResult(activity, status);

        } catch (IntentSender.SendIntentException error) {
          Log.d(TAG, "resolutionForPlayServices", error);
          promise.reject(error);
          return;
        }
      }
    }
    promise.resolve(null);
  }


  /**
   * Prompt the device user to update play services
   */
  @ExpoMethod
  public void makePlayServicesAvailable(final Promise promise) {
    GoogleApiAvailability gapi = GoogleApiAvailability.getInstance();
    int status = gapi.isGooglePlayServicesAvailable(getApplicationContext());

    if (status != ConnectionResult.SUCCESS) {
      Activity activity = getCurrentActivity();
      if (activity != null) {
        gapi.makeGooglePlayServicesAvailable(activity);
      }
    }
    promise.resolve(null);
  }


  @Override
  public Map<String, Object> getConstants() {
    FirebaseApp firebaseApp;

    Map<String, Object> constants = new HashMap<>();
    List<Map<String, Object>> appMapsList = new ArrayList<>();
    List<FirebaseApp> firebaseAppList = FirebaseApp.getApps(getApplicationContext());

    // TODO no way to get client id currently from app options - firebase sdk issue
    for (FirebaseApp app : firebaseAppList) {
      String appName = app.getName();
      FirebaseOptions appOptions = app.getOptions();
      Map<String, Object> appProps = new HashMap<>();

      appProps.put("name", appName);
      appProps.put("apiKey", appOptions.getApiKey());
      appProps.put("appId", appOptions.getApplicationId());
      appProps.put("projectId", appOptions.getProjectId());
      appProps.put("databaseURL", appOptions.getDatabaseUrl());
      appProps.put("messagingSenderId", appOptions.getGcmSenderId());
      appProps.put("storageBucket", appOptions.getStorageBucket());

      appMapsList.add(appProps);
    }

    constants.put("apps", appMapsList);
    constants.put("playServicesAvailability", getPlayServicesStatus());
    return constants;
  }
}
