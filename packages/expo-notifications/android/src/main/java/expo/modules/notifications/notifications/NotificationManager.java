package expo.modules.notifications.notifications;

import android.os.Bundle;
import android.util.Log;

import expo.modules.core.interfaces.SingletonModule;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.WeakHashMap;

import expo.modules.notifications.notifications.interfaces.NotificationListener;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationResponse;
import expo.modules.notifications.service.delegates.ExpoHandlingDelegate;

public class NotificationManager implements SingletonModule, expo.modules.notifications.notifications.interfaces.NotificationManager {
  private static final String SINGLETON_NAME = "NotificationManager";

  /**
   * A weak map of listeners -> reference. Used to check quickly whether given listener
   * is already registered and to iterate over on new token.
   */
  private WeakHashMap<NotificationListener, WeakReference<NotificationListener>> mListenerReferenceMap;
  private Collection<NotificationResponse> mPendingNotificationResponses = new ArrayList<>();
  private Collection<Bundle> mPendingNotificationResponsesFromExtras = new ArrayList<>();

  public NotificationManager() {
    mListenerReferenceMap = new WeakHashMap<>();

    // Registers this singleton instance in static ExpoHandlingDelegate listeners collection.
    // Since it doesn't hold strong reference to the object this should be safe.
    ExpoHandlingDelegate.Companion.addListener(this);
  }

  @Override
  public String getName() {
    return SINGLETON_NAME;
  }

  /**
   * Registers a {@link NotificationListener} by adding a {@link WeakReference} to
   * the {@link NotificationManager#mListenerReferenceMap} map.
   *
   * @param listener Listener to be notified of new messages.
   */
  @Override
  public void addListener(NotificationListener listener) {
    // Check if the listener is already registered
    if (!mListenerReferenceMap.containsKey(listener)) {
      WeakReference<NotificationListener> listenerReference = new WeakReference<>(listener);
      mListenerReferenceMap.put(listener, listenerReference);
      if (!mPendingNotificationResponses.isEmpty()) {
        for (NotificationResponse pendingResponse : mPendingNotificationResponses) {
          listener.onNotificationResponseReceived(pendingResponse);
        }
      }
      if (!mPendingNotificationResponsesFromExtras.isEmpty()) {
        for (Bundle extras : mPendingNotificationResponsesFromExtras) {
          listener.onNotificationResponseIntentReceived(extras);
        }
      }
    }
  }

  /**
   * Unregisters a {@link NotificationListener} by removing the {@link WeakReference} to the listener
   * from the {@link NotificationManager#mListenerReferenceMap} map.
   *
   * @param listener Listener previously registered with {@link NotificationManager#addListener(NotificationListener)}.
   */
  @Override
  public void removeListener(NotificationListener listener) {
    mListenerReferenceMap.remove(listener);
  }

  /**
   * Used by {@link expo.modules.notifications.service.delegates.ExpoSchedulingDelegate} to notify of new messages.
   * Calls {@link NotificationListener#onNotificationReceived(Notification)} on all values
   * of {@link NotificationManager#mListenerReferenceMap}.
   *
   * @param notification Notification received
   */
  public void onNotificationReceived(Notification notification) {
    for (WeakReference<NotificationListener> listenerReference : mListenerReferenceMap.values()) {
      NotificationListener listener = listenerReference.get();
      if (listener != null) {
        listener.onNotificationReceived(notification);
      }
    }
  }

  /**
   * Used by {@link expo.modules.notifications.service.delegates.ExpoSchedulingDelegate} to notify of new notification responses.
   * Calls {@link NotificationListener#onNotificationResponseReceived(NotificationResponse)} on all values
   * of {@link NotificationManager#mListenerReferenceMap}.
   *
   * @param response Notification response received
   */
  public void onNotificationResponseReceived(NotificationResponse response) {
    if (mListenerReferenceMap.isEmpty()) {
      mPendingNotificationResponses.add(response);
    } else {
      for (WeakReference<NotificationListener> listenerReference : mListenerReferenceMap.values()) {
        NotificationListener listener = listenerReference.get();
        if (listener != null) {
          listener.onNotificationResponseReceived(response);
        }
      }
    }
  }

  /**
   * Used by {@link expo.modules.notifications.service.delegates.ExpoSchedulingDelegate} to notify of message deletion event.
   * Calls {@link NotificationListener#onNotificationsDropped()} on all values
   * of {@link NotificationManager#mListenerReferenceMap}.
   */
  public void onNotificationsDropped() {
    for (WeakReference<NotificationListener> listenerReference : mListenerReferenceMap.values()) {
      NotificationListener listener = listenerReference.get();
      if (listener != null) {
        listener.onNotificationsDropped();
      }
    }
  }

  public void onNotificationResponseFromExtras(Bundle extras) {
    if (mPendingNotificationResponsesFromExtras.isEmpty()) {
      mPendingNotificationResponsesFromExtras.add(extras);
    } else {
      for (WeakReference<NotificationListener> listenerReference : mListenerReferenceMap.values()) {
        NotificationListener listener = listenerReference.get();
        if (listener != null) {
          listener.onNotificationResponseIntentReceived(extras);
        }
      }
    }
  }
}
