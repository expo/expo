// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.api.notifications;

import com.cronutils.model.Cron;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.google.firebase.iid.FirebaseInstanceId;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import javax.inject.Inject;

import expo.modules.updates.manifest.raw.RawManifest;
import host.exp.exponent.Constants;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.notifications.ExponentNotificationManager;
import host.exp.exponent.notifications.NotificationActionCenter;
import host.exp.exponent.notifications.NotificationConstants;
import host.exp.exponent.notifications.NotificationHelper;
import host.exp.exponent.notifications.exceptions.UnableToScheduleException;
import host.exp.exponent.notifications.managers.SchedulersManagerProxy;
import host.exp.exponent.notifications.schedulers.CalendarSchedulerModel;
import host.exp.exponent.notifications.schedulers.IntervalSchedulerModel;
import host.exp.exponent.notifications.schedulers.SchedulerImpl;
import host.exp.exponent.storage.ExponentSharedPreferences;

import static host.exp.exponent.notifications.helpers.ExpoCronParser.createCronInstance;

public class NotificationsModule extends ReactContextBaseJavaModule {

  private static final String TAG = NotificationsModule.class.getSimpleName();

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  ExponentManifest mExponentManifest;

  @Inject
  ExponentNetwork mExponentNetwork;

  private final RawManifest mManifest;

  public NotificationsModule(ReactApplicationContext reactContext,
                             RawManifest manifest, Map<String, Object> experienceProperties) {
    super(reactContext);
    NativeModuleDepsProvider.getInstance().inject(NotificationsModule.class, this);
    mManifest = manifest;
  }

  @Override
  public String getName() {
    return "ExponentNotifications";
  }

  @ReactMethod
  public void createCategoryAsync(final String categoryIdParam, final ReadableArray actions, final Promise promise) {
    String categoryId = getScopedIdIfNotDetached(categoryIdParam);
    List<Map<String, Object>> newActions = new ArrayList<>();

    for (Object actionObject : actions.toArrayList()) {
      if (actionObject instanceof Map) {
        Map<String, Object> action = (Map<String, Object>) actionObject;
        newActions.add(action);
      }
    }

    NotificationActionCenter.putCategory(categoryId, newActions);
    promise.resolve(null);
  }

  @ReactMethod
  public void deleteCategoryAsync(final String categoryIdParam, final Promise promise) {
    String categoryId = getScopedIdIfNotDetached(categoryIdParam);
    NotificationActionCenter.removeCategory(categoryId);
    promise.resolve(null);
  }

  private String getScopedIdIfNotDetached(String categoryId) {
    if (!Constants.isStandaloneApp()) {
      try {
        String experienceId = mManifest.getStableLegacyID();
        return experienceId + ":" + categoryId;
      } catch (JSONException e) {
        e.printStackTrace();
      }
    }
    return categoryId;
  }

  @ReactMethod
  public void getDevicePushTokenAsync(final ReadableMap config, final Promise promise) {
    if (!Constants.isStandaloneApp()) {
      promise.reject("getDevicePushTokenAsync is only accessible within standalone applications");
    }
    try {
      if (Constants.FCM_ENABLED) {
        String token = FirebaseInstanceId.getInstance().getToken();
        if (token == null) {
          promise.reject("FCM token has not been set");
        } else {
          WritableMap params = Arguments.createMap();
          params.putString("type", "fcm");
          params.putString("data", token);
          promise.resolve(params);
        }
      } else {
        promise.reject("ERR_NOTIFICATIONS_FCM_NOT_ENABLED", "FCM must be enabled in order to get the device push token");
      }
    } catch (Exception e) {
      EXL.e(TAG, e.getMessage());
      promise.reject(e.getMessage());
    }
  }

  @ReactMethod
  public void getExponentPushTokenAsync(final Promise promise) {
    String uuid = mExponentSharedPreferences.getUUID();
    if (uuid == null) {
      // This should have been set by ExponentNotificationIntentService via
      // ExpoFcmMessagingService#onNewToken -> FcmRegistrationIntentService.registerForeground -> ExponentNotificationIntentService#onHandleIntent
      // (#onNewToken is supposed to be called when a token is generated after app install, see
      // https://developers.google.com/android/reference/com/google/firebase/messaging/FirebaseMessagingService#onNewToken(java.lang.String)).
      // If it hasn't been set, the app probably couldn't register at FCM (invalid configuration?).
      promise.reject("E_GET_PUSH_TOKEN_FAILED", "Couldn't get push token on device. Check that your FCM configuration is valid.");
      return;
    }

    try {
      String experienceId = mManifest.getStableLegacyID();
      NotificationHelper.getPushNotificationToken(uuid, experienceId, mExponentNetwork, mExponentSharedPreferences, new NotificationHelper.TokenListener() {
        @Override
        public void onSuccess(String token) {
          promise.resolve(token);
        }

        @Override
        public void onFailure(Exception e) {
          promise.reject("E_GET_PUSH_TOKEN_FAILED", "Couldn't get push token for device. Check that your FCM configuration is valid.", e);
        }
      });
    } catch (JSONException e) {
      promise.reject("E_GET_PUSH_TOKEN_FAILED", "Couldn't get push token for device. Check that your FCM configuration is valid.", e);
    }
  }

  @ReactMethod
  public void createChannel(String channelId, final ReadableMap data, final Promise promise) {
    String experienceId;
    String channelName;

    try {
      experienceId = mManifest.getStableLegacyID();
    } catch (Exception e) {
      promise.reject("E_FAILED_CREATING_CHANNEL", "Requires Experience ID");
      return;
    }

    if (data.hasKey(NotificationConstants.NOTIFICATION_CHANNEL_NAME)) {
      channelName = data.getString(NotificationConstants.NOTIFICATION_CHANNEL_NAME);
    } else {
      promise.reject("E_FAILED_CREATING_CHANNEL", "Requires channel name");
      return;
    }

    try {
      NotificationHelper.createChannel(
        getReactApplicationContext(),
        experienceId,
        channelId,
        channelName,
        data.toHashMap());
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject("E_FAILED_CREATING_CHANNEL", "Could not create channel", e);
    }
  }

  @ReactMethod
  public void deleteChannel(String channelId, final Promise promise) {
    String experienceId;

    try {
      experienceId = mManifest.getStableLegacyID();
    } catch (Exception e) {
      promise.reject("E_FAILED_DELETING_CHANNEL", "Requires Experience ID");
      return;
    }

    try {
      NotificationHelper.deleteChannel(
        getReactApplicationContext(),
        experienceId,
        channelId);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject("E_FAILED_DELETING_CHANNEL", "Could not delete channel", e);
    }
  }

  @ReactMethod
  public void presentLocalNotification(final ReadableMap data, final Promise promise) {
    presentLocalNotificationWithChannel(data, null, promise);
  }

  @ReactMethod
  public void presentLocalNotificationWithChannel(final ReadableMap data, final ReadableMap legacyChannelData, final Promise promise) {
    HashMap<String, java.io.Serializable> details = new HashMap<>();
    String experienceId;

    HashMap<String, Object> hashMap = data.toHashMap();
    if (data.hasKey("categoryId")) {
      hashMap.put("categoryId", getScopedIdIfNotDetached(data.getString("categoryId")));
    }

    details.put("data", hashMap);

    try {
      experienceId = mManifest.getStableLegacyID();
      details.put("experienceId", experienceId);
    } catch (Exception e) {
      promise.reject("E_FAILED_PRESENTING_NOTIFICATION", "Requires Experience ID");
      return;
    }

    if (legacyChannelData != null) {
      String channelId = data.getString("channelId");
      if (channelId == null) {
        promise.reject("E_FAILED_PRESENTING_NOTIFICATION", "legacyChannelData was nonnull with no channelId");
        return;
      }
      NotificationHelper.maybeCreateLegacyStoredChannel(
        getReactApplicationContext(),
        experienceId,
        channelId,
        legacyChannelData.toHashMap());
    }

    int notificationId = new Random().nextInt();

    NotificationHelper.showNotification(
      getReactApplicationContext(),
      notificationId,
      details,
      mExponentManifest,
      new NotificationHelper.Listener() {
        public void onSuccess(int id) {
          promise.resolve(id);
        }

        public void onFailure(Exception e) {
          promise.reject(e);
        }
      });
  }

  @ReactMethod
  public void scheduleLocalNotification(final ReadableMap data, final ReadableMap options, final Promise promise) {
    scheduleLocalNotificationWithChannel(data, options, null, promise);
  }

  @ReactMethod
  public void scheduleLocalNotificationWithChannel(final ReadableMap data, final ReadableMap options, final ReadableMap legacyChannelData, final Promise promise) {
    if (legacyChannelData != null) {
      String experienceId;
      try {
        experienceId = mManifest.getStableLegacyID();
      } catch (JSONException e) {
        promise.reject("E_FAILED_PRESENTING_NOTIFICATION", "legacyChannelData was nonnull with no channelId or no experienceId");
        return;
      }

      String channelId = data.getString("channelId");
      if (channelId == null) {
        promise.reject("E_FAILED_PRESENTING_NOTIFICATION", "legacyChannelData was nonnull with no channelId or no experienceId");
        return;
      }
      NotificationHelper.maybeCreateLegacyStoredChannel(
        getReactApplicationContext(),
        experienceId,
        channelId,
        legacyChannelData.toHashMap());
    }

    int notificationId = new Random().nextInt();

    HashMap<String, Object> hashMap = data.toHashMap();
    if (data.hasKey("categoryId")) {
      hashMap.put("categoryId", getScopedIdIfNotDetached(data.getString("categoryId")));
    }

    NotificationHelper.scheduleLocalNotification(
      getReactApplicationContext(),
      notificationId,
      hashMap,
      options.toHashMap(),
      mManifest,
      new NotificationHelper.Listener() {
        public void onSuccess(int id) {
          promise.resolve(id);
        }

        public void onFailure(Exception e) {
          promise.reject(e);
        }
      });
  }

  @ReactMethod
  public void dismissNotification(final int notificationId, final Promise promise) {
    try {
      ExponentNotificationManager manager = new ExponentNotificationManager(getReactApplicationContext());
      manager.cancel(
        mManifest.getStableLegacyID(),
        notificationId
      );
      promise.resolve(true);
    } catch (JSONException e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void dismissAllNotifications(final Promise promise) {
    try {
      ExponentNotificationManager manager = new ExponentNotificationManager(getReactApplicationContext());
      manager.cancelAll(mManifest.getStableLegacyID());
      promise.resolve(true);
    } catch (JSONException e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void cancelScheduledNotificationAsync(final int notificationId, final Promise promise) {
    try {
      ExponentNotificationManager manager = new ExponentNotificationManager(getReactApplicationContext());
      manager.cancelScheduled(mManifest.getStableLegacyID(), notificationId);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void cancelScheduledNotificationWithStringIdAsync(final String id, final Promise promise) {
    try {
      SchedulersManagerProxy.getInstance(getReactApplicationContext()
        .getApplicationContext())
        .removeScheduler(id);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void cancelAllScheduledNotificationsAsync(final Promise promise) {
    try {
      ExponentNotificationManager manager = new ExponentNotificationManager(getReactApplicationContext());
      manager.cancelAllScheduled(mManifest.getStableLegacyID());

      String experienceId = mManifest.getStableLegacyID();

      SchedulersManagerProxy
        .getInstance(getReactApplicationContext().getApplicationContext())
        .removeAll(experienceId);

      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void scheduleNotificationWithTimer(final ReadableMap data, final ReadableMap optionsMap, final Promise promise) {
    HashMap<String, Object> options = optionsMap.toHashMap();
    int notificationId = Math.abs(new Random().nextInt());
    HashMap<String, Object> hashMap = data.toHashMap();
    if (data.hasKey("categoryId")) {
      hashMap.put("categoryId", getScopedIdIfNotDetached(data.getString("categoryId")));
    }
    HashMap<String, Object> details = new HashMap<>();
    details.put("data", hashMap);
    String experienceId;

    try {
      experienceId = mManifest.getStableLegacyID();
      details.put("experienceId", experienceId);
    } catch (Exception e) {
      promise.reject(new Exception("Requires Experience Id"));
      return;
    }

    IntervalSchedulerModel intervalSchedulerModel = new IntervalSchedulerModel();
    intervalSchedulerModel.setExperienceId(experienceId);
    intervalSchedulerModel.setNotificationId(notificationId);
    intervalSchedulerModel.setDetails(details);
    intervalSchedulerModel.setRepeat(options.containsKey("repeat") && (Boolean) options.get("repeat"));
    intervalSchedulerModel.setScheduledTime(System.currentTimeMillis() + ((Double) options.get("interval")).longValue());
    intervalSchedulerModel.setInterval(((Double) options.get("interval")).longValue()); // on iOS we cannot change interval

    SchedulerImpl scheduler = new SchedulerImpl(intervalSchedulerModel);

    SchedulersManagerProxy.getInstance(getReactApplicationContext().getApplicationContext()).addScheduler(
      scheduler,
      (String id) -> {
        if (id == null) {
          promise.reject(new UnableToScheduleException());
          return false;
        }
        promise.resolve(id);
        return true;
      }
    );
  }

  @ReactMethod
  public void scheduleNotificationWithCalendar(final ReadableMap data, final ReadableMap optionsMap, final Promise promise) {
    HashMap<String, Object> options = optionsMap.toHashMap();
    int notificationId = Math.abs(new Random().nextInt());
    HashMap<String, Object> hashMap = data.toHashMap();
    if (data.hasKey("categoryId")) {
      hashMap.put("categoryId", getScopedIdIfNotDetached(data.getString("categoryId")));
    }
    HashMap<String, Object> details = new HashMap<>();
    details.put("data", hashMap);
    String experienceId;

    try {
      experienceId = mManifest.getStableLegacyID();
      details.put("experienceId", experienceId);
    } catch (Exception e) {
      promise.reject(new Exception("Requires Experience Id"));
      return;
    }

    Cron cron = createCronInstance(options);

    CalendarSchedulerModel calendarSchedulerModel = new CalendarSchedulerModel();
    calendarSchedulerModel.setExperienceId(experienceId);
    calendarSchedulerModel.setNotificationId(notificationId);
    calendarSchedulerModel.setDetails(details);
    calendarSchedulerModel.setRepeat(options.containsKey("repeat") && (Boolean) options.get("repeat"));
    calendarSchedulerModel.setCalendarData(cron.asString());

    SchedulerImpl scheduler = new SchedulerImpl(calendarSchedulerModel);

    SchedulersManagerProxy.getInstance(getReactApplicationContext().getApplicationContext()).addScheduler(
      scheduler,
      (String id) -> {
        if (id == null) {
          promise.reject(new UnableToScheduleException());
          return false;
        }
        promise.resolve(id);
        return true;
      }
    );
  }

}
