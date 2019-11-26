// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.notifications;

import com.cronutils.model.Cron;

import android.app.NotificationChannel;
import android.app.NotificationChannelGroup;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.service.notification.StatusBarNotification;
import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.MapArguments;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.RegistryLifecycleListener;
import org.unimodules.core.interfaces.services.EventEmitter;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import expo.modules.notifications.action.NotificationActionCenter;
import expo.modules.notifications.channels.ChannelManager;
import expo.modules.notifications.channels.ChannelManagerProvider;
import expo.modules.notifications.channels.ChannelSpecification;
import expo.modules.notifications.channels.ChannelScopeManager;
import expo.modules.notifications.displayers.NotificationDisplayer;
import expo.modules.notifications.helpers.provider.AppIdProvider;
import expo.modules.notifications.push.TokenDispatcher.OnTokenChangeListener;
import expo.modules.notifications.push.TokenDispatcher.ThreadSafeTokenDispatcher;
import expo.modules.notifications.scheduling.schedulers.IntervalSchedulerModel;
import expo.modules.notifications.scheduling.schedulers.SchedulerImpl;
import expo.modules.notifications.postoffice.Mailbox;
import expo.modules.notifications.postoffice.PostOfficeProxy;
import expo.modules.notifications.displayers.BasicNotificationDisplayer;
import expo.modules.notifications.scheduling.schedulers.exceptions.UnableToScheduleException;
import expo.modules.notifications.scheduling.managers.SchedulersManagerProxy;
import expo.modules.notifications.scheduling.schedulers.CalendarSchedulerModel;
import expo.modules.notifications.helpers.scoper.MessageUnscoper;
import expo.modules.notifications.helpers.scoper.NotificationScoper;
import expo.modules.notifications.helpers.scoper.StringScoper;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_CHANNEL_ID;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_DEFAULT_CHANNEL_ID;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_DEFAULT_CHANNEL_NAME;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_APP_ID_KEY;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_ID_KEY;
import static expo.modules.notifications.helpers.ExpoCronParser.createCronInstance;

public class NotificationsModule extends ExportedModule implements RegistryLifecycleListener, Mailbox, OnTokenChangeListener {

  private static final String TAG = NotificationsModule.class.getSimpleName();

  private static final String ON_USER_INTERACTION_EVENT = "Expo.onUserInteraction";
  private static final String ON_FOREGROUND_NOTIFICATION_EVENT = "Expo.onForegroundNotification";
  private static final String ON_TOKEN_CHANGE = "Expo.onTokenChange";

  private Context mContext;
  private String mAppId;
  private ChannelManager mChannelManager;
  private NotificationDisplayer mNotificationDisplayer = new BasicNotificationDisplayer();
  private NotificationScoper mNotificationScoper;
  private StringScoper mStringScoper;
  private EventEmitter mEventEmitter;

  private ModuleRegistry mModuleRegistry = null;

  public NotificationsModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoNotifications";
  }

  @ExpoMethod
  public void flushPendingUserInteractionsAsync(final Promise promise) {
    PostOfficeProxy.getInstance().registerModuleAndFlushPendingUserInteractions(
      mAppId,
            this
    );
    promise.resolve(null);
  }

  @ExpoMethod
  public void createCategoryAsync(final String categoryIdParam, final List<HashMap<String, Object>> actions, final Promise promise) {
    String categoryId = getProperString(categoryIdParam);
    List<Map<String, Object>> newActions = new ArrayList<>();

    for (Object actionObject : actions) {
      if (actionObject instanceof Map) {
        Map<String, Object> action = (Map<String, Object>) actionObject;
        newActions.add(action);
      }
    }

    NotificationActionCenter.putCategory(categoryId, newActions);
    promise.resolve(null);
  }

  @ExpoMethod
  public void deleteCategoryAsync(final String categoryIdParam, final Promise promise) {
    String categoryId = getProperString(categoryIdParam);
    NotificationActionCenter.removeCategory(categoryId);
    promise.resolve(null);
  }

  private String getProperString(String string) { // scoped version returns appIdId+":"+string;
    return mStringScoper.getScopedString(string);
  }

  @ExpoMethod
  public void createChannelAsync(String channelId, final HashMap data, final Promise promise) {
    data.put(NOTIFICATION_CHANNEL_ID, channelId);
    ChannelSpecification channelSpecification = ChannelSpecification.createChannelSpecification(data);

    mChannelManager.addChannel(channelId, channelSpecification, mContext.getApplicationContext(), () -> { promise.resolve(null); });
  }

  @ExpoMethod
  public void deleteChannelAsync(String channelId, final Promise promise) {
    mChannelManager.deleteChannel(channelId, mContext.getApplicationContext(), () -> { promise.resolve(null); });
  }

  @ExpoMethod
  public void createChannelGroupAsync(String groupId, String groupName, final Promise promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      groupId = getProperString(groupId);
      NotificationManager notificationManager =
          (NotificationManager) mContext.getSystemService(Context.NOTIFICATION_SERVICE);
      notificationManager.createNotificationChannelGroup(new NotificationChannelGroup(groupId, groupName));
    }
    promise.resolve(null);
  }

  @ExpoMethod
  public void deleteChannelGroupAsync(String groupId, final Promise promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      groupId = getProperString(groupId);
      NotificationManager notificationManager =
          (NotificationManager) mContext.getSystemService(Context.NOTIFICATION_SERVICE);
      notificationManager.deleteNotificationChannelGroup(groupId);
    }
    promise.resolve(null);
  }

  @ExpoMethod
  public void presentLocalNotificationAsync(HashMap data, final Promise promise) {
    data = mNotificationScoper.scope(data);

    Bundle bundle = new MapArguments(data).toBundle();
    bundle.putString(NOTIFICATION_APP_ID_KEY, mAppId);

    Integer notificationId = Math.abs( new Random().nextInt() );
    bundle.putString(NOTIFICATION_ID_KEY, notificationId.toString());

    mNotificationDisplayer.displayNotification(
        mContext.getApplicationContext(),
        mAppId,
        bundle,
        notificationId
    );

    promise.resolve(notificationId.toString());
  }

  @ExpoMethod
  public void dismissNotificationAsync(final String notificationId, final Promise promise) {
    int id = Integer.parseInt(notificationId);
    NotificationManager notificationManager = (NotificationManager) mContext
        .getSystemService(Context.NOTIFICATION_SERVICE);
    notificationManager.cancel(mAppId, id);
    promise.resolve(null);
  }

  @ExpoMethod
  public void dismissAllNotificationsAsync(final Promise promise) {
    NotificationManager notificationManager = (NotificationManager) mContext
        .getSystemService(Context.NOTIFICATION_SERVICE);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      StatusBarNotification[] activeNotifications = notificationManager.getActiveNotifications();

      for (StatusBarNotification notification : activeNotifications) {
        if (notification.getTag().equals(mAppId)) {
          notificationManager.cancel(notification.getTag(), notification.getId());
        }
      }

      promise.resolve(null);
    } else {
      promise.reject("FUNCTION_NOT_AVAILABLE","Function dismissAllNotifications is available from android 6.0");
    }
  }

  @ExpoMethod
  public void cancelScheduledNotificationAsync(final String notificationId, final Promise promise) {
    SchedulersManagerProxy.getInstance(mContext.getApplicationContext()
        .getApplicationContext())
        .removeScheduler(notificationId);

    dismissNotificationAsync(notificationId, promise);
  }

  @ExpoMethod
  public void cancelAllScheduledNotificationsAsync(final Promise promise) {
    SchedulersManagerProxy
        .getInstance(mContext.getApplicationContext())
        .removeAll(mAppId);

    dismissAllNotificationsAsync(promise);
  }

  @ExpoMethod
  public void registerForPushNotificationsAsync(final Promise promise) {
    ThreadSafeTokenDispatcher.getInstance(mContext).registerForTokenChange(mAppId, this);
    promise.resolve(null);
  }

  @ExpoMethod
  public void scheduleNotificationWithTimerAsync(HashMap<String, Object> data, final HashMap<String, Object> options, final Promise promise) {
    data = mNotificationScoper.scope(data);
    data.put(NOTIFICATION_APP_ID_KEY, mAppId);

    HashMap<String, Object> details = new HashMap<>();
    details.put("data", data);

    details.put("appId", mAppId);

    IntervalSchedulerModel intervalSchedulerModel = new IntervalSchedulerModel();
    intervalSchedulerModel.setappId(mAppId);
    intervalSchedulerModel.setDetails(details);
    intervalSchedulerModel.setRepeat(options.containsKey("repeat") && (Boolean) options.get("repeat"));
    intervalSchedulerModel.setScheduledTime(System.currentTimeMillis() + ((Double) options.get("interval")).longValue());
    intervalSchedulerModel.setInterval(((Double) options.get("interval")).longValue()); // on iOS we cannot change interval

    SchedulerImpl scheduler = new SchedulerImpl(intervalSchedulerModel);

    SchedulersManagerProxy.getInstance(mContext.getApplicationContext()).addScheduler(
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

  @ExpoMethod
  public void scheduleNotificationWithCalendarAsync(HashMap data, final HashMap options, final Promise promise) {
    data = mNotificationScoper.scope(data);
    data.put(NOTIFICATION_APP_ID_KEY, mAppId);

    HashMap<String, Object> details = new HashMap<>();
    details.put("data", data);

    Cron cron = createCronInstance(options);

    CalendarSchedulerModel calendarSchedulerModel = new CalendarSchedulerModel();
    calendarSchedulerModel.setappId(mAppId);
    calendarSchedulerModel.setDetails(details);
    calendarSchedulerModel.setRepeat(options.containsKey("repeat") && (Boolean) options.get("repeat"));
    calendarSchedulerModel.setCalendarData(cron.asString());

    SchedulerImpl scheduler = new SchedulerImpl(calendarSchedulerModel);

    SchedulersManagerProxy.getInstance(mContext.getApplicationContext()).addScheduler(
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

  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
    //we need application context
    mContext = moduleRegistry.getModule(ActivityProvider.class).getCurrentActivity().getApplicationContext();

    AppIdProvider appIdProvider = moduleRegistry.getModule(AppIdProvider.class);
    mAppId = appIdProvider.getAppId();

    mStringScoper = mModuleRegistry.getModule(StringScoper.class);
    createDefaultChannel();
    mChannelManager = getChannelManager();
    mNotificationScoper = new NotificationScoper(mStringScoper);
    mEventEmitter = mModuleRegistry.getModule(EventEmitter.class);
  }

  private void createDefaultChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      CharSequence name = NOTIFICATION_DEFAULT_CHANNEL_NAME;
      int importance = NotificationManager.IMPORTANCE_DEFAULT;
      NotificationChannel channel = new NotificationChannel(NOTIFICATION_DEFAULT_CHANNEL_ID, name, importance);
      NotificationManager notificationManager = mContext.getSystemService(NotificationManager.class);
      notificationManager.createNotificationChannel(channel);
    }
  }

  protected ChannelManager getChannelManager() {
    ChannelManager channelManager = ChannelManagerProvider.getChannelManager();
    ChannelManager channelScopeManager = new ChannelScopeManager(mStringScoper);
    channelScopeManager.setNextChannelManager(channelManager);
    return channelScopeManager;
  }

  @Override
  public void onDestroy() {
    PostOfficeProxy.getInstance().unregisterModule(mAppId);
    ThreadSafeTokenDispatcher.getInstance(mContext).unregister(mAppId);
  }

  @Override
  public void onUserInteraction(Bundle userInteraction) {
    userInteraction = MessageUnscoper.getUnscopedMessage(userInteraction, mStringScoper);
    if (mEventEmitter != null) {
      mEventEmitter.emit(ON_USER_INTERACTION_EVENT, userInteraction);
    }
  }

  @Override
  public void onForegroundNotification(Bundle notification) {
    notification = MessageUnscoper.getUnscopedMessage(notification, mStringScoper);
    if (mEventEmitter != null) {
      mEventEmitter.emit(ON_FOREGROUND_NOTIFICATION_EVENT, notification);
    }
  }

  @Override
  public void onTokenChange(String token) {
    if (mEventEmitter != null) {
      Bundle msg = new Bundle();
      msg.putString("token", token);
      mEventEmitter.emit(ON_TOKEN_CHANGE, msg);
    }
  }

}
