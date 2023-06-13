package com.swmansion.reanimated;

import android.util.Log;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.UIBlock;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.UIManagerModuleListener;
import java.util.ArrayList;
import javax.annotation.Nullable;

@ReactModule(name = ReanimatedModule.NAME)
public class ReanimatedModule extends ReactContextBaseJavaModule
    implements LifecycleEventListener, UIManagerModuleListener {

  public static final String NAME = "ReanimatedModule";

  private interface UIThreadOperation {
    void execute(NodesManager nodesManager);
  }

  private ArrayList<UIThreadOperation> mOperations = new ArrayList<>();
  private @Nullable NodesManager mNodesManager;

  public ReanimatedModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public void initialize() {
    ReactApplicationContext reactCtx = getReactApplicationContext();
    UIManagerModule uiManager = reactCtx.getNativeModule(UIManagerModule.class);
    reactCtx.addLifecycleEventListener(this);
    uiManager.addUIManagerListener(this);
  }

  @Override
  public void onHostPause() {
    if (mNodesManager != null) {
      mNodesManager.onHostPause();
    }
  }

  @Override
  public void onHostResume() {
    if (mNodesManager != null) {
      mNodesManager.onHostResume();
    }
  }

  @Override
  public void onHostDestroy() {
    // do nothing
  }

  @Override
  public void willDispatchViewUpdates(final UIManagerModule uiManager) {
    if (mOperations.isEmpty()) {
      return;
    }
    final ArrayList<UIThreadOperation> operations = mOperations;
    mOperations = new ArrayList<>();
    uiManager.addUIBlock(
        new UIBlock() {
          @Override
          public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
            NodesManager nodesManager = getNodesManager();
            for (UIThreadOperation operation : operations) {
              operation.execute(nodesManager);
            }
          }
        });
  }

  @Override
  public String getName() {
    return NAME;
  }

  /*package*/
  public NodesManager getNodesManager() {
    if (mNodesManager == null) {
      mNodesManager = new NodesManager(getReactApplicationContext());
    }

    return mNodesManager;
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public void installTurboModule() {
    // When debugging in chrome the JS context is not available.
    // https://github.com/facebook/react-native/blob/v0.67.0-rc.6/ReactAndroid/src/main/java/com/facebook/react/modules/blob/BlobCollector.java#L25
    Utils.isChromeDebugger = getReactApplicationContext().getJavaScriptContextHolder().get() == 0;

    if (!Utils.isChromeDebugger) {
      this.getNodesManager().initWithContext(getReactApplicationContext());
    } else {
      Log.w(
          "[REANIMATED]",
          "Unable to create Reanimated Native Module. You can ignore this message if you are using Chrome Debugger now.");
    }
  }

  @ReactMethod
  public void addListener(String eventName) {
    // Keep: Required for RN built in Event Emitter Calls.
  }

  @ReactMethod
  public void removeListeners(Integer count) {
    // Keep: Required for RN built in Event Emitter Calls.
  }

  @Override
  public void onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy();

    if (mNodesManager != null) {
      mNodesManager.onCatalystInstanceDestroy();
    }
  }
}
