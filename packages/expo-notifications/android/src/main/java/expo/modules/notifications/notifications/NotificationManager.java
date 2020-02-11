package expo.modules.notifications.notifications;

import com.google.firebase.messaging.RemoteMessage;

import org.unimodules.core.interfaces.SingletonModule;

import java.lang.ref.WeakReference;
import java.util.WeakHashMap;

import expo.modules.notifications.FirebaseListenerService;
import expo.modules.notifications.notifications.interfaces.NotificationListener;

public class NotificationManager implements SingletonModule, expo.modules.notifications.notifications.interfaces.NotificationManager {
  private static final String SINGLETON_NAME = "NotificationManager";

  /**
   * A weak map of listeners -> reference. Used to check quickly whether given listener
   * is already registered and to iterate over on new token.
   */
  private WeakHashMap<NotificationListener, WeakReference<NotificationListener>> mListenerReferenceMap;

  public NotificationManager() {
    mListenerReferenceMap = new WeakHashMap<>();

    // Registers this singleton instance in static FirebaseListenerService listeners collection.
    // Since it doesn't hold strong reference to the object this should be safe.
    FirebaseListenerService.addNotificationListener(this);
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
   * Used by {@link FirebaseListenerService} to notify of new messages.
   * Calls {@link NotificationListener#onMessage(RemoteMessage)} on all values
   * of {@link NotificationManager#mListenerReferenceMap}.
   *
   * @param message New remote message
   */
  public void onMessage(RemoteMessage message) {
    for (WeakReference<NotificationListener> listenerReference : mListenerReferenceMap.values()) {
      NotificationListener listener = listenerReference.get();
      if (listener != null) {
        listener.onMessage(message);
      }
    }
  }

  /**
   * Used by {@link FirebaseListenerService} to notify of message deletion event.
   * Calls {@link NotificationListener#onDeletedMessages()} on all values
   * of {@link NotificationManager#mListenerReferenceMap}.
   */
  public void onDeletedMessages() {
    for (WeakReference<NotificationListener> listenerReference : mListenerReferenceMap.values()) {
      NotificationListener listener = listenerReference.get();
      if (listener != null) {
        listener.onDeletedMessages();
      }
    }
  }
}
