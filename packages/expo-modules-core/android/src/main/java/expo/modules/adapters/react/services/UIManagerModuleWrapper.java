package expo.modules.adapters.react.services;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;
import android.view.View;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.UIManagerModule;

import expo.modules.core.interfaces.ActivityEventListener;
import expo.modules.core.interfaces.ActivityProvider;
import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.JavaScriptContextProvider;
import expo.modules.core.interfaces.LifecycleEventListener;
import expo.modules.core.interfaces.services.UIManager;

import java.lang.ref.WeakReference;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.WeakHashMap;

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
  public <T> void addUIBlock(final int tag, final UIBlock<T> block, final Class<T> tClass) {
    getContext().getNativeModule(UIManagerModule.class).addUIBlock(new com.facebook.react.uimanager.UIBlock() {
      @Override
      public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
        View view = nativeViewHierarchyManager.resolveView(tag);
        if (view == null) {
          block.reject(new IllegalArgumentException("Expected view for this tag not to be null."));
        } else {
          try {
            if (tClass.isInstance(view)) {
              block.resolve(tClass.cast(view));
            } else {
              block.reject(new IllegalStateException(
                  "Expected view to be of " + tClass + "; found " + view.getClass() + " instead"));
            }
          } catch (Exception e) {
            block.reject(e);
          }
        }
      }
    });
  }

  @Override
  public void addUIBlock(final GroupUIBlock block) {
    getContext().getNativeModule(UIManagerModule.class).addUIBlock(new com.facebook.react.uimanager.UIBlock() {
      @Override
      public void execute(final NativeViewHierarchyManager nativeViewHierarchyManager) {
        block.execute(new ViewHolder() {
          @Override
          public View get(Object key) {
            if (key instanceof Number) {
              try {
                return nativeViewHierarchyManager.resolveView(((Number) key).intValue());
              } catch (IllegalViewOperationException e) {
                return null;
              }
            } else {
              Log.w("E_INVALID_TAG", "Provided tag is of class " + key.getClass() + " whereas React expects tags to be integers. Are you sure you're providing proper argument to addUIBlock?");
            }
            return null;
          }
        });
      }
    });
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

  public void runOnNativeModulesQueueThread(Runnable runnable) {
    if (mReactContext.isOnNativeModulesQueueThread()) {
      runnable.run();
    } else {
      mReactContext.runOnNativeModulesQueueThread(runnable);
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

  public CallInvokerHolderImpl getJSCallInvokerHolder() {
    return (CallInvokerHolderImpl) mReactContext.getCatalystInstance().getJSCallInvokerHolder();
  }

  @Override
  public Activity getCurrentActivity() {
    return getContext().getCurrentActivity();
  }
}
