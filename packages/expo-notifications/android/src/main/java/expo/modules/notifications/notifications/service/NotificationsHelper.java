package expo.modules.notifications.notifications.service;

import android.content.Context;
import android.os.Bundle;
import android.os.ResultReceiver;
import android.util.Log;

import java.io.IOException;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.WeakHashMap;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.ProcessLifecycleOwner;
import expo.modules.notifications.notifications.NotificationManager;
import expo.modules.notifications.notifications.interfaces.NotificationsReconstructor;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationBehavior;
import expo.modules.notifications.notifications.model.NotificationCategory;
import expo.modules.notifications.notifications.model.NotificationResponse;
import expo.modules.notifications.service.NotificationsService;

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

  private SharedPreferencesNotificationCategoriesStore mStore;
  private NotificationsHelperLifecycleObserver mLifecycleObserver;
  private Context mContext;

  /**
   * A weak map of listeners -> reference. Used to check quickly whether given listener
   * is already registered and to iterate over when notifying of new token.
   */
  protected static WeakHashMap<NotificationManager, WeakReference<NotificationManager>> sListenersReferences = new WeakHashMap<>();

  protected static Collection<NotificationResponse> sPendingNotificationResponses = new ArrayList<>();

  public NotificationsHelper(Context context, NotificationsReconstructor notificationsReconstructor) {
    this.mContext = context.getApplicationContext();
    mStore = new SharedPreferencesNotificationCategoriesStore(context);

    // Note we're not removing the observer anywhere because NotificationsHelper
    // does not receive any information about its removal.
    // NotificationsHelperLifecycleObserver does not hold strong reference to this class
    // so we try to leak as little as possible.
    mLifecycleObserver = new NotificationsHelperLifecycleObserver(this);
    ProcessLifecycleOwner.get().getLifecycle().addObserver(mLifecycleObserver);
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

  private boolean mIsAppInForeground = ProcessLifecycleOwner.get().getLifecycle().getCurrentState().isAtLeast(Lifecycle.State.RESUMED);

  public void onResume() {
    mIsAppInForeground = true;
  }

  public void onPause() {
    mIsAppInForeground = false;
  }

  /**
   * A function returning all presented notifications to receiver
   *
   * @param receiver A receiver to which send the notifications
   */
  public void getAllPresented(@Nullable ResultReceiver receiver) {
    NotificationsService.Companion.enqueueGetAllPresented(mContext, receiver);
  }

  /**
   * A helper function for presenting a notification
   *
   * @param notification Notification to present
   * @param behavior     Allowed notification behavior
   * @param receiver     A receiver to which send the result of presenting the notification
   */
  public void presentNotification(@NonNull Notification notification, @Nullable NotificationBehavior behavior, @Nullable ResultReceiver receiver) {
    NotificationsService.Companion.enqueuePresent(mContext, notification, behavior, receiver);
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
      notifyReceiverSuccess(receiver, null);
    } else {
      // Receiver is notified by NotificationsService
      NotificationsService.Companion.enqueuePresent(mContext, notification, null, receiver);
    }
  }

  /**
   * A helper function for dismissing notification.
   *
   * @param identifier Notification identifier
   */
  public void dismiss(@NonNull String identifier, @Nullable ResultReceiver receiver) {
    NotificationsService.Companion.enqueueDismiss(mContext, new String[]{identifier}, receiver);
  }

  /**
   * A helper function for dismissing multiple notifications
   *
   * @param identifiers Notification identifiers
   */
  public void enqueueDismissSelected(@NonNull String[] identifiers, @Nullable ResultReceiver receiver) {
    NotificationsService.Companion.enqueueDismiss(mContext, identifiers, receiver);
  }

  /**
   * A helper function for dispatching all notification
   */
  public void dismissAll(@Nullable ResultReceiver receiver) {
    NotificationsService.Companion.enqueueDismissAll(mContext, receiver);
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
