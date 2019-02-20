package expo.adapters.react.services;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.AsyncTask;
import android.support.annotation.NonNull;
import android.util.Log;
import android.view.View;

import com.facebook.common.references.CloseableReference;
import com.facebook.datasource.DataSource;
import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.imagepipeline.core.ImagePipeline;
import com.facebook.imagepipeline.datasource.BaseBitmapDataSubscriber;
import com.facebook.imagepipeline.image.CloseableImage;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.UIManagerModule;

import java.lang.ref.WeakReference;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.WeakHashMap;

import javax.annotation.Nullable;

import expo.core.interfaces.ActivityEventListener;
import expo.core.interfaces.ActivityProvider;
import expo.core.interfaces.InternalModule;
import expo.core.interfaces.JavaScriptContextProvider;
import expo.core.interfaces.LifecycleEventListener;
import expo.core.interfaces.services.UIManager;
import expo.interfaces.imageloader.ImageLoader;
import expo.interfaces.permissions.PermissionsListener;
import expo.interfaces.permissions.PermissionsManager;

public class UIManagerModuleWrapper implements
    ActivityProvider,
    ImageLoader,
    InternalModule,
    JavaScriptContextProvider,
    PermissionsManager,
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
        ImageLoader.class,
        JavaScriptContextProvider.class,
        PermissionsManager.class,
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

  @Override
  public boolean requestPermissions(String[] permissions, final int requestCode, final PermissionsListener listener) {
    Activity currentActivity = getContext().getCurrentActivity();
    if (currentActivity instanceof PermissionAwareActivity) {
      PermissionAwareActivity activity = (PermissionAwareActivity) currentActivity;
      activity.requestPermissions(permissions, requestCode, new PermissionListener() {
        @Override
        public boolean onRequestPermissionsResult(int realRequestCode, String[] permissions, int[] grantResults) {
          if (requestCode == realRequestCode) {
            listener.onPermissionResult(permissions, grantResults);
            return true;
          } else {
            return false;
          }
        }
      });
      return true;
    } else {
      return false;
    }
  }

  public long getJavaScriptContextRef() {
    return mReactContext.getJavaScriptContextHolder().get();
  }

  @Override
  public void loadImageFromURL(@NonNull String url, final ResultListener resultListener) {
    ImageRequest imageRequest = ImageRequest.fromUri(url);

    ImagePipeline imagePipeline = Fresco.getImagePipeline();
    DataSource<CloseableReference<CloseableImage>> dataSource =
        imagePipeline.fetchDecodedImage(imageRequest, mReactContext);

    dataSource.subscribe(
        new BaseBitmapDataSubscriber() {
          @Override
          public void onNewResultImpl(@Nullable Bitmap bitmap) {
            if (bitmap == null) {
              resultListener.onFailure(new Exception("Loaded bitmap is null"));
              return;
            }
            resultListener.onSuccess(bitmap);
          }

          @Override
          public void onFailureImpl(DataSource dataSource) {
            resultListener.onFailure(dataSource.getFailureCause());
          }
        },
        AsyncTask.THREAD_POOL_EXECUTOR);
  }

  @Override
  public Activity getCurrentActivity() {
    return getContext().getCurrentActivity();
  }
}
