package expo.modules.adapters.react.services;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;
import android.view.View;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.common.annotations.FrameworkAPI;
import com.facebook.react.fabric.FabricUIManager;
import com.facebook.react.fabric.interop.UIBlockViewResolver;
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.common.UIManagerType;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.WeakHashMap;

import androidx.annotation.Nullable;
import expo.modules.BuildConfig;
import expo.modules.core.interfaces.ActivityEventListener;
import expo.modules.core.interfaces.ActivityProvider;
import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.JavaScriptContextProvider;
import expo.modules.core.interfaces.LifecycleEventListener;
import expo.modules.core.interfaces.services.UIManager;

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

  private void addToUIManager(final UIBlockInterface block) {
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      com.facebook.react.bridge.UIManager uiManager = UIManagerHelper.getUIManager(getContext(), UIManagerType.FABRIC);
      Objects.requireNonNull(((FabricUIManager) uiManager)).addUIBlock(block);
    } else {
      UIManagerModule uiManager = getContext().getNativeModule(UIManagerModule.class);
      Objects.requireNonNull(uiManager).addUIBlock(block);
    }
  }

  @Override
  @SuppressWarnings("deprecation")
  public <T> void addUIBlock(final int tag, final UIBlock<T> block, final Class<T> tClass) {
    UIBlockInterface uiBlock = new UIBlockInterface() {
      @Override
      public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
        executeImpl(nativeViewHierarchyManager, null);
      }

      @Override
      public void execute(UIBlockViewResolver uiBlockViewResolver) {
        executeImpl(null, uiBlockViewResolver);
      }

      private void executeImpl(NativeViewHierarchyManager nativeViewHierarchyManager, UIBlockViewResolver uiBlockViewResolver) {
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
    };

    addToUIManager(uiBlock);
  }

  @Override
  @SuppressWarnings("deprecation")
  public void addUIBlock(final GroupUIBlock block) {
    UIBlockInterface uiBlock = new UIBlockInterface() {
      @Override
      public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
        executeImpl(nativeViewHierarchyManager, null);
      }

      @Override
      public void execute(UIBlockViewResolver uiBlockViewResolver) {
        executeImpl(null, uiBlockViewResolver);
      }

      private void executeImpl(NativeViewHierarchyManager nativeViewHierarchyManager, UIBlockViewResolver uiBlockViewResolver) {
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
    };

    addToUIManager(uiBlock);
  }

  @Nullable
  @Override
  @SuppressWarnings("deprecation")
  public View resolveView(int viewTag) {
    final com.facebook.react.bridge.UIManager uiManager = UIManagerHelper.getUIManagerForReactTag(getContext(), viewTag);
    if (uiManager == null) {
      return null;
    }
    return uiManager.resolveView(viewTag);
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

@SuppressWarnings("deprecation")
interface UIBlockInterface extends com.facebook.react.uimanager.UIBlock, com.facebook.react.fabric.interop.UIBlock {
}
