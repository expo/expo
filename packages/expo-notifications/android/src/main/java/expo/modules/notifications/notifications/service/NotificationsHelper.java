package expo.modules.notifications.notifications.service;

import android.annotation.SuppressLint;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Parcel;
import android.os.ResultReceiver;
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
import expo.modules.notifications.notifications.interfaces.NotificationsReconstructor;
import expo.modules.notifications.notifications.interfaces.NotificationsScoper;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationBehavior;
import expo.modules.notifications.notifications.model.NotificationCategory;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.model.NotificationResponse;
import expo.modules.notifications.notifications.presentation.builders.ExpoNotificationBuilder;

import static android.content.Context.NOTIFICATION_SERVICE;

/**
 * A notification service foundation handling incoming intents
 * and delegating work to specific methods.
 */
public class NotificationsHelper {

  // Known result codes
  public static final int SUCCESS_CODE = 0;
  @SuppressWarnings("unused")
  public static final int EXCEPTION_OCCURRED_CODE = -1;
  public static final String EXCEPTION_KEY = "exception";
  public static final String NOTIFICATIONS_KEY = "notifications";
  public static final String CATEGORIES_KEY = "categories";

  public static final String INTERNAL_IDENTIFIER_SCHEME = "expo-notifications";
  public static final String INTERNAL_IDENTIFIER_AUTHORITY = "foreign_notifications";
  public static final String INTERNAL_IDENTIFIER_TAG_KEY = "tag";
  public static final String INTERNAL_IDENTIFIER_ID_KEY = "id";

  protected static final int ANDROID_NOTIFICATION_ID = 0;

  private Context mContext;
  private NotificationsReconstructor mNotificationsReconstructor;
  private SharedPreferencesNotificationCategoriesStore mStore;

  /**
   * A weak map of listeners -> reference. Used to check quickly whether given listener
   * is already registered and to iterate over when notifying of new token.
   */
  protected static WeakHashMap<NotificationManager, WeakReference<NotificationManager>> sListenersReferences = new WeakHashMap<>();

  protected static Collection<NotificationResponse> sPendingNotificationResponses = new ArrayList<>();

  public NotificationsHelper(Context context, NotificationsReconstructor notificationsReconstructor) {
    this.mContext = context.getApplicationContext();
    this.mNotificationsReconstructor = notificationsReconstructor;
    WeakReference<LifecycleObserver> observer = new WeakReference<>(new DefaultLifecycleObserver() {
      @Override
      public void onResume(@NonNull LifecycleOwner owner) {
        mIsAppInForeground = true;
      }

      @Override
      public void onPause(@NonNull LifecycleOwner owner) {
        mIsAppInForeground = false;
      }
    });
    mStore = new SharedPreferencesNotificationCategoriesStore(context);
    ProcessLifecycleOwner.get().getLifecycle().addObserver(observer.get());
  }

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

  /**
   * A function returning all presented notifications to receiver
   *
   * @param receiver A receiver to which send the notifications
   */
  public void getAllPresented(@Nullable ResultReceiver receiver) {
    Bundle bundle = new Bundle();
    bundle.putParcelableArrayList(NOTIFICATIONS_KEY, new ArrayList<>(getDisplayedNotifications()));
    notifyReceiverSuccess(receiver, bundle);
  }

  /**
   * A helper function for presenting a notification
   *
   * @param notification Notification to present
   * @param behavior     Allowed notification behavior
   * @param receiver     A receiver to which send the result of presenting the notification
   */
  public void presentNotification(@NonNull Notification notification, @Nullable NotificationBehavior behavior, @Nullable ResultReceiver receiver) {
    String tag = notification.getNotificationRequest().getIdentifier();
    NotificationManagerCompat.from(mContext).notify(tag, ANDROID_NOTIFICATION_ID, getNotification(mContext, notification, behavior));
    notifyReceiverSuccess(receiver, null);
  }

  /**
   * A helper function for handling received notification
   *
   * @param notification Notification received
   */
  public void notificationReceived(Notification notification) {
    notificationReceived(notification, null);
  }

  /**
   * A helper function for handling received notification
   *
   * @param notification Notification received
   * @param receiver     Result receiver
   */
  public void notificationReceived(Notification notification, ResultReceiver receiver) {
    if (mIsAppInForeground) {
      for (NotificationManager listener : getListeners()) {
        listener.onNotificationReceived(notification);
      }
    } else {
      presentNotification(notification, null, null);
    }
    notifyReceiverSuccess(receiver, null);
  }

  /**
   * A helper function for dismissing notification.
   *
   * @param identifier Notification identifier
   */
  public void dismiss(@NonNull String identifier, @Nullable ResultReceiver receiver) {
    dismiss(identifier);
    notifyReceiverSuccess(receiver, null);
  }

  /**
   * A helper function for dismissing multiple notifications
   *
   * @param identifiers Notification identifiers
   */
  public void enqueueDismissSelected(@NonNull String[] identifiers, @Nullable ResultReceiver receiver) {
    for (String identifier : identifiers) {
      dismiss(identifier);
    }
    notifyReceiverSuccess(receiver, null);
  }

  private void dismiss(@NonNull String identifier) {
    Pair<String, Integer> foreignNotification = parseNotificationIdentifier(identifier);
    if (foreignNotification != null) {
      // Foreign notification identified by us
      NotificationManagerCompat.from(mContext).cancel(foreignNotification.first, foreignNotification.second);
    } else {
      // Let's hope it's our notification, we have no reason to believe otherwise
      NotificationManagerCompat.from(mContext).cancel(identifier, ANDROID_NOTIFICATION_ID);
    }
  }

  /**
   * A helper function for dispatching all notification
   */
  public void dismissAll(@Nullable ResultReceiver receiver) {
    NotificationManagerCompat.from(mContext).cancelAll();
    notifyReceiverSuccess(receiver, null);
  }

  /**
   * A helper function for dispatching dropped notification
   */
  public void dropped(@Nullable ResultReceiver receiver) {
    for (NotificationManager listener : getListeners()) {
      listener.onNotificationsDropped();
    }
    notifyReceiverSuccess(receiver, null);
  }

  /**
   * A helper function for handling notification's response
   *
   * @param response Notification response received
   */
  public void responseReceived(NotificationResponse response) {
    Collection<NotificationManager> listeners = getListeners();
    if (listeners.isEmpty()) {
      sPendingNotificationResponses.add(response);
    } else {
      for (NotificationManager listener : listeners) {
        listener.onNotificationResponseReceived(response);
      }
    }
  }

  private void notifyReceiverSuccess(@Nullable ResultReceiver receiver, @Nullable Bundle data) {
    if (receiver != null) {
      receiver.send(SUCCESS_CODE, data);
    }
  }

  /**
   * Callback called to fetch a collection of currently displayed notifications.
   *
   * <b>Note:</b> This feature is only supported on Android 23+.
   *
   * @return A collection of currently displayed notifications.
   */
  protected Collection<Notification> getDisplayedNotifications() {
    // getActiveNotifications() is not supported on platforms below Android 23
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      return Collections.emptyList();
    }

    android.app.NotificationManager manager = (android.app.NotificationManager) mContext.getSystemService(NOTIFICATION_SERVICE);
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

  protected android.app.Notification getNotification(Context context, Notification notification, NotificationBehavior behavior) {
    return NotificationsScoper.create(context).createBuilderCreator().get(context, mStore)
      .setNotification(notification)
      .setAllowedBehavior(behavior)
      .build();
  }

  public Collection<NotificationCategory> getCategories() {
    return mStore.getAllNotificationCategories();
  }

  public NotificationCategory setCategory(NotificationCategory category) {
    try {
      return mStore.saveNotificationCategory(category);
    } catch (IOException e) {
      Log.e("expo-notifications", String.format("Could not save category \"%s\": %s.", category.getIdentifier(), e.getMessage()));
      e.printStackTrace();
      return null;
    }
  }

  public boolean deleteCategory(String identifier) {
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
        NotificationRequest request = mNotificationsReconstructor.reconstructNotificationRequest(parcel);
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
        .setSticky((notification.flags & android.app.Notification.FLAG_ONGOING_EVENT) != 0)
        .setBody(fromBundle(notification.extras))
        .build();
      NotificationRequest request = new NotificationRequest(getInternalIdentifierKey(statusBarNotification), content, null);
      return new Notification(request, new Date(statusBarNotification.getPostTime()));
    }
    return null;
  }

  /**
   * Creates an identifier for given {@link StatusBarNotification}. It's supposed to be parsable
   * by {@link NotificationsHelper#parseNotificationIdentifier(String)}.
   *
   * @param notification Notification to be identified
   * @return String identifier
   */
  protected String getInternalIdentifierKey(StatusBarNotification notification) {
    Uri.Builder builder = Uri.parse(INTERNAL_IDENTIFIER_SCHEME + "://" + INTERNAL_IDENTIFIER_AUTHORITY).buildUpon();
    if (notification.getTag() != null) {
      builder.appendQueryParameter(INTERNAL_IDENTIFIER_TAG_KEY, notification.getTag());
    }
    builder.appendQueryParameter(INTERNAL_IDENTIFIER_ID_KEY, Integer.toString(notification.getId()));
    return builder.toString();
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

  /**
   * Tries to parse given identifier as an internal foreign notification identifier
   * created by us in {@link NotificationsHelper#getInternalIdentifierKey(StatusBarNotification)}.
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

}
