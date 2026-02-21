package expo.modules.adapters.react.services;

import android.app.Activity;
import android.content.Intent;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.annotations.FrameworkAPI;
import com.facebook.react.common.annotations.UnstableReactNativeAPI;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.WeakHashMap;

import androidx.annotation.OptIn;
import expo.modules.core.interfaces.ActivityEventListener;
import expo.modules.core.interfaces.ActivityProvider;
import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.JavaScriptContextProvider;
import expo.modules.core.interfaces.LifecycleEventListener;
import expo.modules.core.interfaces.services.UIManager;

@OptIn(markerClass = UnstableReactNativeAPI.class)
public class UIManagerModuleWrapper implements
  ActivityProvider,
  InternalModule,
  JavaScriptContextProvider,
  UIManager {
  private ReactContext mReactContext;
  private Map<LifecycleEventListener, com.facebook.react.bridge.LifecycleEventListener> mLifecycleListenersMap = new WeakHashMap<>();
  private Map<ActivityEventListener, com.facebook.react.bridge.ActivityEventListener> mActivityEventListenersMap = new WeakHashMap<>();

  public UIManagerModuleWrapper(ReactContext reactContext) {
    mReactContext = reactContext;
  }

  protected ReactContext getContext() {
    return mReactContext;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Arrays.<Class>asList(
      ActivityProvider.class,
      JavaScriptContextProvider.class,
      UIManager.class
    );
  }

  @Override
  public void runOnUiQueueThread(Runnable runnable) {
    if (getContext().isOnUiQueueThread()) {
      runnable.run();
    } else {
      getContext().runOnUiQueueThread(runnable);
    }
  }

  @Override
  public void runOnClientCodeQueueThread(Runnable runnable) {
    if (getContext().isOnJSQueueThread()) {
      runnable.run();
    } else {
      getContext().runOnJSQueueThread(runnable);
    }
  }

  @Override
  public void registerLifecycleEventListener(final LifecycleEventListener listener) {
    final WeakReference<LifecycleEventListener> weakListener = new WeakReference<>(listener);
    mLifecycleListenersMap.put(listener, new com.facebook.react.bridge.LifecycleEventListener() {
      @Override
      public void onHostResume() {
        LifecycleEventListener listener = weakListener.get();
        if (listener != null) {
          listener.onHostResume();
        }
      }

      @Override
      public void onHostPause() {
        LifecycleEventListener listener = weakListener.get();
        if (listener != null) {
          listener.onHostPause();
        }
      }

      @Override
      public void onHostDestroy() {
        LifecycleEventListener listener = weakListener.get();
        if (listener != null) {
          listener.onHostDestroy();
        }
      }
    });
    mReactContext.addLifecycleEventListener(mLifecycleListenersMap.get(listener));
  }

  @Override
  public void onDestroy() {
    // We need to create a copy to avoid ConcurrentModificationException
    ArrayList<com.facebook.react.bridge.LifecycleEventListener> tmpList = new ArrayList<>(mLifecycleListenersMap.values());
    for (com.facebook.react.bridge.LifecycleEventListener listener : tmpList) {
      listener.onHostDestroy();
    }

    for (com.facebook.react.bridge.LifecycleEventListener listener : mLifecycleListenersMap.values()) {
      mReactContext.removeLifecycleEventListener(listener);
    }
    mLifecycleListenersMap.clear();
  }

  @Override
  public void unregisterLifecycleEventListener(LifecycleEventListener listener) {
    getContext().removeLifecycleEventListener(mLifecycleListenersMap.get(listener));
    mLifecycleListenersMap.remove(listener);
  }

  @Override
  public void registerActivityEventListener(final ActivityEventListener activityEventListener) {
    final WeakReference<ActivityEventListener> weakListener = new WeakReference<>(activityEventListener);

    mActivityEventListenersMap.put(activityEventListener, new com.facebook.react.bridge.ActivityEventListener() {
      @Override
      public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        ActivityEventListener listener = weakListener.get();
        if (listener != null) {
          listener.onActivityResult(activity, requestCode, resultCode, data);
        }
      }

      @Override
      public void onNewIntent(Intent intent) {
        ActivityEventListener listener = weakListener.get();
        if (listener != null) {
          listener.onNewIntent(intent);
        }
      }
    });

    mReactContext.addActivityEventListener(mActivityEventListenersMap.get(activityEventListener));
  }

  @Override
  public void unregisterActivityEventListener(final ActivityEventListener activityEventListener) {
    getContext().removeActivityEventListener(mActivityEventListenersMap.get(activityEventListener));
    mActivityEventListenersMap.remove(activityEventListener);
  }

  public long getJavaScriptContextRef() {
    return mReactContext.getJavaScriptContextHolder().get();
  }

  @androidx.annotation.OptIn(markerClass = FrameworkAPI.class)
  @SuppressWarnings("deprecation")
  public CallInvokerHolderImpl getJSCallInvokerHolder() {
    return (CallInvokerHolderImpl) mReactContext.getCatalystInstance().getJSCallInvokerHolder();
  }

  @Override
  public Activity getCurrentActivity() {
    return getContext().getCurrentActivity();
  }
}
