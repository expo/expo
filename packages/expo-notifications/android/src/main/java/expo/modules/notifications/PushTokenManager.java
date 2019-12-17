package expo.modules.notifications;

import org.unimodules.core.interfaces.SingletonModule;

import java.lang.ref.WeakReference;
import java.util.Collection;
import java.util.HashSet;
import java.util.WeakHashMap;

public class PushTokenManager implements SingletonModule {
  static /* package */ WeakReference<PushTokenListener> CALLBACK;

  private PushTokenListener mCallback;
  private Collection<WeakReference<PushTokenListener>> mListeners;
  private WeakHashMap<PushTokenListener, WeakReference<PushTokenListener>> mListenerReferenceMap;

  public PushTokenManager() {
    mListeners = new HashSet<>();
    mListenerReferenceMap = new WeakHashMap<>();
    mCallback = new PushTokenListener() {
      @Override
      public void onNewToken(String token) {
        for (WeakReference<PushTokenListener> listenerReference : PushTokenManager.this.mListeners) {
          PushTokenListener listener = listenerReference.get();
          if (listener != null) {
            listener.onNewToken(token);
          }
        }
      }
    };

    PushTokenManager.CALLBACK = new WeakReference<>(mCallback);
  }

  @Override
  public String getName() {
    return "PushTokenManager";
  }

  public void addListener(PushTokenListener listener) {
    WeakReference<PushTokenListener> listenerReference = new WeakReference<>(listener);
    mListenerReferenceMap.put(listener, listenerReference);
    mListeners.add(listenerReference);
  }

  public void removeListener(PushTokenListener listener) {
    WeakReference<PushTokenListener> listenerReference = mListenerReferenceMap.get(listener);
    mListeners.remove(listenerReference);
    mListenerReferenceMap.remove(listener);
  }
}
