package expo.modules.notifications.notifications.service;

import android.app.Notification;

import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collection;
import java.util.WeakHashMap;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationManagerCompat;
import androidx.lifecycle.DefaultLifecycleObserver;
import androidx.lifecycle.LifecycleObserver;
import androidx.lifecycle.LifecycleOwner;
import androidx.lifecycle.ProcessLifecycleOwner;
import expo.modules.notifications.notifications.NotificationManager;
import expo.modules.notifications.notifications.interfaces.NotificationBehavior;
import expo.modules.notifications.notifications.interfaces.NotificationBuilder;
import expo.modules.notifications.notifications.interfaces.NotificationTrigger;
import expo.modules.notifications.notifications.presentation.builders.ExpoNotificationBuilder;

/**
 * A notification service using {@link ExpoNotificationBuilder} to build notifications.
 * Capable of presenting the notifications to the user.
 */
public class ExpoNotificationsService extends BaseNotificationsService {
  /**
   * A weak map of listeners -> reference. Used to check quickly whether given listener
   * is already registered and to iterate over when notifying of new token.
   */
  protected static WeakHashMap<NotificationManager, WeakReference<NotificationManager>> sListenersReferences = new WeakHashMap<>();

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
  protected void onNotificationReceived(String identifier, JSONObject request, NotificationTrigger trigger) {
    if (mIsAppInForeground) {
      for (NotificationManager listener : getListeners()) {
        listener.onNotificationReceived(identifier, request, trigger);
      }
    } else {
      BaseNotificationsService.enqueuePresent(this, identifier, request, null, null);
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
    NotificationManagerCompat.from(this).cancel(getNotificationTag(identifier, null), getNotificationId(identifier, null));
  }

  @Override
  protected void onDismissAllNotifications() {
    NotificationManagerCompat.from(this).cancelAll();
  }

  /**
   * Callback called when the service is supposed to present a notification.
   *
   * @param identifier Notification identifier
   * @param request    Notification request
   * @param behavior   Allowed notification behavior
   */
  protected void onNotificationPresent(String identifier, JSONObject request, NotificationBehavior behavior) {
    String tag = getNotificationTag(identifier, request);
    int id = getNotificationId(identifier, request);
    Notification notification = getNotification(request, behavior);
    NotificationManagerCompat.from(this).notify(tag, id, notification);
  }

  /**
   * @param identifier Notification identifier
   * @param request    Notification request
   * @return Tag to use to identify the notification.
   */
  protected String getNotificationTag(String identifier, JSONObject request) {
    return identifier;
  }

  /**
   * @param identifier Notification identifier
   * @param request    Notification request
   * @return A numeric identifier to use to identify the notification
   */
  protected int getNotificationId(String identifier, JSONObject request) {
    return 0;
  }

  protected NotificationBuilder getNotificationBuilder() {
    return new ExpoNotificationBuilder(this);
  }

  protected Notification getNotification(JSONObject request, NotificationBehavior behavior) {
    return getNotificationBuilder()
        .setNotificationRequest(request)
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
