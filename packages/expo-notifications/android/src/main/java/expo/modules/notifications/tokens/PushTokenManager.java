package expo.modules.notifications.tokens;

import expo.modules.core.interfaces.SingletonModule;

import java.lang.ref.WeakReference;
import java.util.WeakHashMap;

import expo.modules.notifications.service.NotificationsService;
import expo.modules.notifications.service.delegates.FirebaseMessagingDelegate;
import expo.modules.notifications.tokens.interfaces.FirebaseTokenListener;
import expo.modules.notifications.tokens.interfaces.PushTokenListener;

public class PushTokenManager implements SingletonModule, FirebaseTokenListener, expo.modules.notifications.tokens.interfaces.PushTokenManager {
  private static final String SINGLETON_NAME = "PushTokenManager";

  /**
   * We store this value to be able to inform new listeners of last known token.
   */
  private String mLastToken;

  /**
   * A weak map of listeners -> reference. Used to check quickly whether given listener
   * is already registered and to iterate over on new token.
   */
  private WeakHashMap<PushTokenListener, WeakReference<PushTokenListener>> mListenerReferenceMap;

  public PushTokenManager() {
    mListenerReferenceMap = new WeakHashMap<>();

    // Registers this singleton instance in static FirebaseListenerService listeners collection.
    // Since it doesn't hold strong reference to the object this should be safe.
    FirebaseMessagingDelegate.addTokenListener(this);
  }

  @Override
  public String getName() {
    return SINGLETON_NAME;
  }

  /**
   * Registers a {@link PushTokenListener} by adding a {@link WeakReference} to
   * the {@link PushTokenManager#mListenerReferenceMap} map.
   *
   * @param listener Listener to be notified of new device push tokens.
   */
  @Override
  public void addListener(PushTokenListener listener) {
    // Check if the listener is already registered
    if (!mListenerReferenceMap.containsKey(listener)) {
      WeakReference<PushTokenListener> listenerReference = new WeakReference<>(listener);
      mListenerReferenceMap.put(listener, listenerReference);
      // Since it's a new listener and we know of a last valid value, let's let them know.
      if (mLastToken != null) {
        listener.onNewToken(mLastToken);
      }
    }
  }

  /**
   * Unregisters a {@link PushTokenListener} by removing the {@link WeakReference} to the listener
   * from the {@link PushTokenManager#mListenerReferenceMap} map.
   *
   * @param listener Listener previously registered with {@link PushTokenManager#addListener(PushTokenListener)}.
   */
  @Override
  public void removeListener(PushTokenListener listener) {
    mListenerReferenceMap.remove(listener);
  }

  /**
   * Used by {@link NotificationsService} to notify of new tokens.
   * Calls {@link PushTokenListener#onNewToken(String)} on all values
   * of {@link PushTokenManager#mListenerReferenceMap}.
   *
   * @param token New device push token.
   */
  @Override
  public void onNewToken(String token) {
    for (WeakReference<PushTokenListener> listenerReference : mListenerReferenceMap.values()) {
      PushTokenListener listener = listenerReference.get();
      if (listener != null) {
        listener.onNewToken(token);
      }
    }

    mLastToken = token;
  }
}
