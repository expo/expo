package expo.adapters.react.services;

import android.app.Activity;
import android.graphics.Bitmap;
import android.os.AsyncTask;
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
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.UIManagerModule;

import java.lang.ref.WeakReference;
import java.util.*;

import expo.core.interfaces.*;
import expo.core.interfaces.services.UIManager;
import expo.interfaces.imageloader.ImageLoader;
import expo.interfaces.permissions.PermissionsManager;
import expo.interfaces.permissions.PermissionsListener;

import javax.annotation.Nullable;

public class UIManagerModuleWrapper implements
    ActivityProvider,
    ImageLoader,
    InternalModule,
    JavaScriptContextProvider,
    PermissionsManager,
    UIManager
{
  private ReactContext mReactContext;
  private Map<LifecycleEventListener, com.facebook.react.bridge.LifecycleEventListener> mLifecycleListenersMap = new WeakHashMap<>();

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
  public void loadImageFromURL(String url, final ResultListener resultListener) {
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
