package expo.adapters.react.services;

import android.app.Activity;
import android.view.View;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.UIManagerModule;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.WeakHashMap;

import expo.core.interfaces.LifecycleEventListener;
import expo.core.interfaces.Module;
import expo.core.interfaces.services.UIManager;
import expo.interfaces.permissions.PermissionsManager;
import expo.interfaces.permissions.PermissionsListener;

public class UIManagerModuleWrapper implements Module, UIManager, PermissionsManager {
  private ReactContext mReactContext;
  private Map<LifecycleEventListener, com.facebook.react.bridge.LifecycleEventListener> mLifecycleListenersMap = new WeakHashMap<>();

  public UIManagerModuleWrapper(ReactContext reactContext) {
    mReactContext = reactContext;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Arrays.asList((Class) PermissionsManager.class, UIManager.class, UIManagerModuleWrapper.class);
  }

  @Override
  public <T extends View> void addUIBlock(final int tag, final UIBlock<T> block) {
    mReactContext.getNativeModule(UIManagerModule.class).addUIBlock(new com.facebook.react.uimanager.UIBlock() {
      @Override
      public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
        View view = nativeViewHierarchyManager.resolveView(tag);
        if (view == null) {
          block.reject(new IllegalArgumentException("Expected view for this tag not to be null."));
        } else {
          try {
            @SuppressWarnings("unchecked")
            T typedView = (T) view;
            block.resolve(typedView);
          } catch (ClassCastException e) {
            block.reject(new IllegalStateException("Expected view not to be of class " + view.getClass()));
          } catch (Exception e) {
            block.reject(e);
          }
        }
      }
    });
  }



  @Override
  public void registerLifecycleEventListener(final LifecycleEventListener listener) {
    mLifecycleListenersMap.put(listener, new com.facebook.react.bridge.LifecycleEventListener() {
      @Override
      public void onHostResume() {
        listener.onHostResume();
      }

      @Override
      public void onHostPause() {
        listener.onHostPause();
      }

      @Override
      public void onHostDestroy() {
        listener.onHostDestroy();
      }
    });
    mReactContext.addLifecycleEventListener(mLifecycleListenersMap.get(listener));
  }

  @Override
  public void unregisterLifecycleEventListener(LifecycleEventListener listener) {
    mReactContext.removeLifecycleEventListener(mLifecycleListenersMap.get(listener));
    mLifecycleListenersMap.remove(listener);
  }

  public void unregisterEventListeners() {
    for (com.facebook.react.bridge.LifecycleEventListener listener : mLifecycleListenersMap.values()) {
      mReactContext.removeLifecycleEventListener(listener);
    }
    mLifecycleListenersMap.clear();
  }

  @Override
  public boolean requestPermissions(String[] permissions, final int requestCode, final PermissionsListener listener) {
    Activity currentActivity = mReactContext.getCurrentActivity();
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
}
