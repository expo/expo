package expo.modules.notifications.notifications.service;

import android.annotation.SuppressLint;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Parcel;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import android.util.Pair;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.Iterator;
import java.util.Objects;
import java.util.WeakHashMap;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationManagerCompat;
import androidx.lifecycle.DefaultLifecycleObserver;
import androidx.lifecycle.LifecycleObserver;
import androidx.lifecycle.LifecycleOwner;
import androidx.lifecycle.ProcessLifecycleOwner;
import expo.modules.notifications.notifications.NotificationManager;
import expo.modules.notifications.notifications.enums.NotificationPriority;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationBehavior;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.model.NotificationResponse;
import expo.modules.notifications.notifications.model.NotificationCategory;
import expo.modules.notifications.notifications.presentation.builders.CategoryAwareNotificationBuilder;
import expo.modules.notifications.notifications.presentation.builders.ExpoNotificationBuilder;

/**
 * A notification service using {@link CategoryAwareNotificationBuilder} to build notifications.
 * Capable of presenting the notifications to the user.
 */
public class ExpoNotificationsService extends BaseNotificationsService {
  /**
   * {@link Notification} has an intrinsic identifier, which is a String. We use it
   * as a notification tag, when passing notifications to {@link NotificationManagerCompat}.
   * Since it identifies notifications by (String tag, int id), we still need to use some ID
   * to properly handle the notification. This implementation uses a static ID = 0.
   */
  protected static final int ANDROID_NOTIFICATION_ID = 0;
  public static final String INTERNAL_IDENTIFIER_SCHEME = "expo-notifications";
  public static final String INTERNAL_IDENTIFIER_AUTHORITY = "foreign_notifications";
  public static final String INTERNAL_IDENTIFIER_TAG_KEY = "tag";
  public static final String INTERNAL_IDENTIFIER_ID_KEY = "id";
  /**
   * A weak map of listeners -> reference. Used to check quickly whether given listener
   * is already registered and to iterate over when notifying of new token.
   */
  protected static WeakHashMap<NotificationManager, WeakReference<NotificationManager>> sListenersReferences = new WeakHashMap<>();

  protected static Collection<NotificationResponse> sPendingNotificationResponses = new ArrayList<>();

  /**
   * Used only by {@link NotificationManager} instances. If you look for a place to register
   * your listener, use {@link NotificationManager} singleton module.
   * <p>
   * Purposefully the argument is expected to be a {@link NotificationManager} and just a listener.
   * <p>
   * This class doesn't hold strong references to listeners, so you need to own your listeners.
   *
   * @param listener A listener instance to be informed of new push device tokens.
   */
  public static void addListener(NotificationManager listener) {
    // Checks whether this listener has already been registered
    if (!sListenersReferences.containsKey(listener)) {
      WeakReference<NotificationManager> listenerReference = new WeakReference<>(listener);
      sListenersReferences.put(listener, listenerReference);
      if (!sPendingNotificationResponses.isEmpty()) {
        Iterator<NotificationResponse> responseIterator = sPendingNotificationResponses.iterator();
        while (responseIterator.hasNext()) {
          listener.onNotificationResponseReceived(responseIterator.next());
          responseIterator.remove();
        }
      }
    }
  }

  private boolean mIsAppInForeground = false;

  private LifecycleObserver mObserver = new DefaultLifecycleObserver() {
    @Override
    public void onResume(@NonNull LifecycleOwner owner) {
      mIsAppInForeground = true;
    }

    @Override
    public void onPause(@NonNull LifecycleOwner owner) {
      mIsAppInForeground = false;
    }
  };

  private SharedPreferencesNotificationCategoriesStore mStore;

  @Override
  public void onCreate() {
    super.onCreate();
    mStore = new SharedPreferencesNotificationCategoriesStore(this);
    ProcessLifecycleOwner.get().getLifecycle().addObserver(mObserver);
  }

  @Override
  public void onDestroy() {
    ProcessLifecycleOwner.get().getLifecycle().removeObserver(mObserver);
    super.onDestroy();
  }

  @Override
  protected void onNotificationReceived(Notification notification) {
    if (mIsAppInForeground) {
      for (NotificationManager listener : getListeners()) {
        listener.onNotificationReceived(notification);
      }
    } else {
      BaseNotificationsService.enqueuePresent(this, notification, null, null);
    }
  }

  @Override
  protected void onNotificationsDropped() {
    for (NotificationManager listener : getListeners()) {
      listener.onNotificationsDropped();
    }
  }

  @Override
  protected void onNotificationDismiss(String identifier) {
    Pair<String, Integer> foreignNotification = parseNotificationIdentifier(identifier);
    if (foreignNotification != null) {
      // Foreign notification identified by us
      NotificationManagerCompat.from(this).cancel(foreignNotification.first, foreignNotification.second);
    } else {
      // Let's hope it's our notification, we have no reason to believe otherwise
      NotificationManagerCompat.from(this).cancel(identifier, ANDROID_NOTIFICATION_ID);
    }
  }

  /**
   * Creates an identifier for given {@link StatusBarNotification}. It's supposed to be parsable
   * by {@link ExpoNotificationsService#parseNotificationIdentifier(String)}.
   *
   * @param notification Notification to be identified
   * @return String identifier
   */
  protected static String getInternalIdentifierKey(StatusBarNotification notification) {
    Uri.Builder builder = Uri.parse(INTERNAL_IDENTIFIER_SCHEME + "://" + INTERNAL_IDENTIFIER_AUTHORITY).buildUpon();
    if (notification.getTag() != null) {
      builder.appendQueryParameter(INTERNAL_IDENTIFIER_TAG_KEY, notification.getTag());
    }
    builder.appendQueryParameter(INTERNAL_IDENTIFIER_ID_KEY, Integer.toString(notification.getId()));
    return builder.toString();
  }

  /**
   * Tries to parse given identifier as an internal foreign notification identifier
   * created by us in {@link ExpoNotificationsService#getInternalIdentifierKey(StatusBarNotification)}.
   *
   * @param identifier String identifier of the notification
   * @return Pair of (notification tag, notification id), if the identifier could be parsed. null otherwise.
   */
  public static Pair<String, Integer> parseNotificationIdentifier(String identifier) {
    Uri parsedIdentifier = Uri.parse(identifier);
    try {
      if (INTERNAL_IDENTIFIER_SCHEME.equals(parsedIdentifier.getScheme()) && INTERNAL_IDENTIFIER_AUTHORITY.equals(parsedIdentifier.getAuthority())) {
        String tag = parsedIdentifier.getQueryParameter(INTERNAL_IDENTIFIER_TAG_KEY);
        int id = Integer.parseInt(Objects.requireNonNull(parsedIdentifier.getQueryParameter(INTERNAL_IDENTIFIER_ID_KEY)));
        return new Pair<>(tag, id);
      }
    } catch (NullPointerException | NumberFormatException | UnsupportedOperationException e) {
      Log.e("expo-notifications", "Malformed foreign notification identifier: " + identifier, e);
    }
    return null;
  }

  @Override
  protected void onDismissAllNotifications() {
    NotificationManagerCompat.from(this).cancelAll();
  }

  @Override
  protected void onNotificationResponseReceived(NotificationResponse response) {
    Collection<NotificationManager> listeners = getListeners();
    if (listeners.isEmpty()) {
      sPendingNotificationResponses.add(response);
    } else {
      for (NotificationManager listener : listeners) {
        listener.onNotificationResponseReceived(response);
      }
    }
  }

  /**
   * Callback called when the service is supposed to present a notification.
   *
   * @param notification Notification presented
   * @param behavior     Allowed notification behavior
   */
  @Override
  protected void onNotificationPresent(expo.modules.notifications.notifications.model.Notification notification, NotificationBehavior behavior) {
    String tag = notification.getNotificationRequest().getIdentifier();
    NotificationManagerCompat.from(this).notify(tag, ANDROID_NOTIFICATION_ID, getNotification(notification, behavior));
  }

  /**
   * Callback called to fetch a collection of currently displayed notifications.
   *
   * <b>Note:</b> This feature is only supported on Android 23+.
   *
   * @return A collection of currently displayed notifications.
   */
  @Override
  protected Collection<Notification> getDisplayedNotifications() {
    // getActiveNotifications() is not supported on platforms below Android 23
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      return Collections.emptyList();
    }

    android.app.NotificationManager manager = (android.app.NotificationManager) getSystemService(NOTIFICATION_SERVICE);
    Collection<Notification> notifications = new ArrayList<>();
    StatusBarNotification[] activeNotifications = manager.getActiveNotifications();
    for (StatusBarNotification statusBarNotification : activeNotifications) {
      Notification notification = getNotification(statusBarNotification);
      if (notification != null) {
        notifications.add(notification);
      }
    }
    return notifications;
  }

  @Override
  protected Collection<NotificationCategory> onGetCategories() {
    return mStore.getAllNotificationCategories();
  }

  @Override
  protected NotificationCategory onSetCategory(NotificationCategory category) {
    try {
      return mStore.saveNotificationCategory(category);
    } catch (IOException e) {
      Log.e("expo-notifications", String.format("Could not save category \"%s\": %s.", category.getIdentifier(), e.getMessage()));
      e.printStackTrace();
      return null;
    }
  }

  @Override
  protected boolean onDeleteCategory(String identifier) {
    return mStore.removeNotificationCategory(identifier);
  }

  @Nullable
  protected Notification getNotification(StatusBarNotification statusBarNotification) {
    android.app.Notification notification = statusBarNotification.getNotification();
    byte[] notificationRequestByteArray = notification.extras.getByteArray(ExpoNotificationBuilder.EXTRAS_MARSHALLED_NOTIFICATION_REQUEST_KEY);
    if (notificationRequestByteArray != null) {
      try {
        Parcel parcel = Parcel.obtain();
        parcel.unmarshall(notificationRequestByteArray, 0, notificationRequestByteArray.length);
        parcel.setDataPosition(0);
        NotificationRequest request = reconstructNotificationRequest(parcel);
        parcel.recycle();
        Date notificationDate = new Date(statusBarNotification.getPostTime());
        return new Notification(request, notificationDate);
      } catch (Exception e) {
        // Let's catch all the exceptions -- there's nothing we can do here
        // and we'd rather return an array without a single, invalid notification
        // than throw an exception and return none.
        @SuppressLint("DefaultLocale")
        String message = String.format("Could not have unmarshalled NotificationRequest from (%s, %d).", statusBarNotification.getTag(), statusBarNotification.getId());
        Log.e("expo-notifications", message);
      }
    } else {
      // It's not our notification. Let's do what we can.
      NotificationContent content = new NotificationContent.Builder()
        .setTitle(notification.extras.getString(android.app.Notification.EXTRA_TITLE))
        .setText(notification.extras.getString(android.app.Notification.EXTRA_TEXT))
        .setSubtitle(notification.extras.getString(android.app.Notification.EXTRA_SUB_TEXT))
        // using deprecated field
        .setPriority(NotificationPriority.fromNativeValue(notification.priority))
        // using deprecated field
        .setVibrationPattern(notification.vibrate)
        // using deprecated field
        .setSound(notification.sound)
        .setAutoDismiss((notification.flags & android.app.Notification.FLAG_AUTO_CANCEL) != 0)
        .setBody(fromBundle(notification.extras))
        .build();
      NotificationRequest request = new NotificationRequest(getInternalIdentifierKey(statusBarNotification), content, null);
      return new Notification(request, new Date(statusBarNotification.getPostTime()));
    }
    return null;
  }

  protected JSONObject fromBundle(Bundle bundle) {
    JSONObject json = new JSONObject();
    for (String key : bundle.keySet()) {
      try {
        json.put(key, JSONObject.wrap(bundle.get(key)));
      } catch (JSONException e) {
        // can't do anything about it apart from logging it
        Log.d("expo-notifications", "Error encountered while serializing Android notification extras: " + key + " -> " + bundle.get(key), e);
      }
    }
    return json;
  }

  protected NotificationRequest reconstructNotificationRequest(Parcel parcel) {
    return NotificationRequest.CREATOR.createFromParcel(parcel);
  }

  protected android.app.Notification getNotification(Notification notification, NotificationBehavior behavior) {
    return new CategoryAwareNotificationBuilder(this)
        .setNotification(notification)
        .setAllowedBehavior(behavior)
        .build();
  }

  private Collection<NotificationManager> getListeners() {
    Collection<NotificationManager> listeners = new ArrayList<>();
    for (WeakReference<NotificationManager> reference : sListenersReferences.values()) {
      NotificationManager manager = reference.get();
      if (manager != null) {
        listeners.add(manager);
      }
    }
    return listeners;
  }
}
