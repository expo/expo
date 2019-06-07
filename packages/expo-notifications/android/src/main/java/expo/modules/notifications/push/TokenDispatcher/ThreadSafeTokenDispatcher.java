package expo.modules.notifications.push.TokenDispatcher;

import android.content.Context;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import expo.modules.notifications.push.PushNotificationEngineProvider;
import expo.modules.notifications.push.TokenDispatcher.engines.Engine;

public class ThreadSafeTokenDispatcher implements TokenDispatcher {

  private Executor mSingleThreadExecutor = Executors.newSingleThreadExecutor();
  private static volatile ThreadSafeTokenDispatcher instance = null;

  private TokenDispatcher mNextTokenDispatcher = null;

  private ThreadSafeTokenDispatcher() { }

  private ThreadSafeTokenDispatcher(Context context) {
    Engine engine = PushNotificationEngineProvider.getPushNotificationEngine(context);
    mNextTokenDispatcher = new SimpleTokenDispatcher(context.getApplicationContext(), engine);
  }

  public static synchronized TokenDispatcher getInstance(Context context) {
    if (instance == null) {
      instance = new ThreadSafeTokenDispatcher(context);
    }
    return instance;
  }

  @Override
  public void onNewToken(String token, Runnable continuation) {
    mSingleThreadExecutor.execute(() -> {
      mNextTokenDispatcher.onNewToken(token, () -> {});
      continuation.run();
    });
  }

  @Override
  public void registerForTokenChange(String appId, OnTokenChangeListener onTokenChangeListener) {
    mSingleThreadExecutor.execute(() -> mNextTokenDispatcher.registerForTokenChange(appId, onTokenChangeListener));
  }

  @Override
  public void unregister(String appId) {
    mSingleThreadExecutor.execute(() -> mNextTokenDispatcher.unregister(appId));
  }
}
