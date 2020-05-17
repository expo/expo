package expo.modules.notifications.notifications.service;

import android.annotation.SuppressLint;
import android.os.Build;
import android.os.Parcel;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.Iterator;
import java.util.WeakHashMap;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationManagerCompat;
import androidx.lifecycle.DefaultLifecycleObserver;
import androidx.lifecycle.LifecycleObserver;
import androidx.lifecycle.LifecycleOwner;
import androidx.lifecycle.ProcessLifecycleOwner;
import expo.modules.notifications.notifications.NotificationManager;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationBehavior;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.model.NotificationResponse;
import expo.modules.notifications.notifications.presentation.builders.ExpoNotificationBuilder;

/**
 * A notification service using {@link ExpoNotificationBuilder} to build notifications.
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

  @Override
  public void onCreate() {
    super.onCreate();
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
    NotificationManagerCompat.from(this).cancel(identifier, ANDROID_NOTIFICATION_ID);
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

  @Nullable
  protected Notification getNotification(StatusBarNotification statusBarNotification) {
    android.app.Notification notification = statusBarNotification.getNotification();
    byte[] notificationRequestByteArray = notification.extras.getByteArray(ExpoNotificationBuilder.EXTRAS_MARSHALLED_NOTIFICATION_REQUEST_KEY);
    if (notificationRequestByteArray != null) {
      try {
        Parcel parcel = Parcel.obtain();
        parcel.unmarshall(notificationRequestByteArray, 0, notificationRequestByteArray.length);
        parcel.setDataPosition(0);
        NotificationRequest request = NotificationRequest.CREATOR.createFromParcel(parcel);
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
    }
    return null;
  }

  protected android.app.Notification getNotification(Notification notification, NotificationBehavior behavior) {
    return new ExpoNotificationBuilder(this)
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
