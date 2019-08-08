package versioned.host.exp.exponent.modules.api.reanimated;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.UIBlock;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.UIManagerModuleListener;
import versioned.host.exp.exponent.modules.api.reanimated.transitions.TransitionModule;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

import javax.annotation.Nullable;

@ReactModule(name = ReanimatedModule.NAME)
public class ReanimatedModule extends ReactContextBaseJavaModule implements
        LifecycleEventListener, UIManagerModuleListener {

  protected static final String NAME = "ReanimatedModule";

  private interface UIThreadOperation {
    void execute(NodesManager nodesManager);
  }

  private ArrayList<UIThreadOperation> mOperations = new ArrayList<>();

  private @Nullable NodesManager mNodesManager;
  private @Nullable TransitionModule mTransitionManager;

  public ReanimatedModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public void initialize() {
    ReactApplicationContext reactCtx = getReactApplicationContext();
    UIManagerModule uiManager = reactCtx.getNativeModule(UIManagerModule.class);
    reactCtx.addLifecycleEventListener(this);
    uiManager.addUIManagerListener(this);
    mTransitionManager = new TransitionModule(uiManager);
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
    uiManager.addUIBlock(new UIBlock() {
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

  private NodesManager getNodesManager() {
    if (mNodesManager == null) {
      mNodesManager = new NodesManager(getReactApplicationContext());
    }

    return mNodesManager;
  }

  @ReactMethod
  public void animateNextTransition(int tag, ReadableMap config) {
    mTransitionManager.animateNextTransition(tag, config);
  }

  @ReactMethod
  public void createNode(final int tag, final ReadableMap config) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NodesManager nodesManager) {
        nodesManager.createNode(tag, config);
      }
    });
  }

  @ReactMethod
  public void dropNode(final int tag) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NodesManager nodesManager) {
        nodesManager.dropNode(tag);
      }
    });
  }

  @ReactMethod
  public void connectNodes(final int parentID, final int childID) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NodesManager nodesManager) {
        nodesManager.connectNodes(parentID, childID);
      }
    });
  }

  @ReactMethod
  public void disconnectNodes(final int parentID, final int childID) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NodesManager nodesManager) {
        nodesManager.disconnectNodes(parentID, childID);
      }
    });
  }

  @ReactMethod
  public void connectNodeToView(final int nodeID, final int viewTag) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NodesManager nodesManager) {
        nodesManager.connectNodeToView(nodeID, viewTag);
      }
    });
  }

  @ReactMethod
  public void disconnectNodeFromView(final int nodeID, final int viewTag) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NodesManager nodesManager) {
        nodesManager.disconnectNodeFromView(nodeID, viewTag);
      }
    });
  }

  @ReactMethod
  public void attachEvent(final int viewTag, final String eventName, final int eventNodeID) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NodesManager nodesManager) {
        nodesManager.attachEvent(viewTag, eventName, eventNodeID);
      }
    });
  }

  @ReactMethod
  public void detachEvent(final int viewTag, final String eventName, final int eventNodeID) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NodesManager nodesManager) {
        nodesManager.detachEvent(viewTag, eventName, eventNodeID);
      }
    });
  }

  @ReactMethod
  public void configureProps(ReadableArray nativePropsArray, ReadableArray uiPropsArray) {
    int size = nativePropsArray.size();
    final Set<String> nativeProps = new HashSet<>(size);
    for (int i = 0; i < size; i++) {
      nativeProps.add(nativePropsArray.getString(i));
    }

    size = uiPropsArray.size();
    final Set<String> uiProps = new HashSet<>(size);
    for (int i = 0; i < size; i++) {
      uiProps.add(uiPropsArray.getString(i));
    }
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NodesManager nodesManager) {
        nodesManager.configureProps(nativeProps, uiProps);
      }
    });
  }

  @ReactMethod
  public void getValue(final int nodeID, final Callback callback) {
    mOperations.add(new UIThreadOperation() {
      @Override
      public void execute(NodesManager nodesManager) {
        nodesManager.getValue(nodeID, callback);
      }
    });
  }
}
