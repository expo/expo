package abi30_0_0.host.exp.exponent.modules.api.reanimated;

import android.util.SparseArray;

import abi30_0_0.com.facebook.react.bridge.GuardedRunnable;
import abi30_0_0.com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import abi30_0_0.com.facebook.react.bridge.ReactContext;
import abi30_0_0.com.facebook.react.bridge.ReadableMap;
import abi30_0_0.com.facebook.react.bridge.UiThreadUtil;
import abi30_0_0.com.facebook.react.bridge.WritableMap;
import abi30_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;
import abi30_0_0.com.facebook.react.modules.core.ReactChoreographer;
import abi30_0_0.com.facebook.react.uimanager.GuardedFrameCallback;
import abi30_0_0.com.facebook.react.uimanager.ReactShadowNode;
import abi30_0_0.com.facebook.react.uimanager.UIImplementation;
import abi30_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi30_0_0.com.facebook.react.uimanager.UIManagerReanimatedHelper;
import abi30_0_0.com.facebook.react.uimanager.events.Event;
import abi30_0_0.com.facebook.react.uimanager.events.EventDispatcherListener;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.AlwaysNode;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.BezierNode;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.BlockNode;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.ClockNode;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.ClockOpNode;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.ConcatNode;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.CondNode;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.DebugNode;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.EventNode;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.JSCallNode;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.Node;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.NoopNode;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.OperatorNode;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.PropsNode;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.SetNode;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.StyleNode;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.TransformNode;
import abi30_0_0.host.exp.exponent.modules.api.reanimated.nodes.ValueNode;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicBoolean;

public class NodesManager implements EventDispatcherListener {

  private static final Double ZERO = Double.valueOf(0);

  public interface OnAnimationFrame {
    void onAnimationFrame();
  }

  private final SparseArray<Node> mAnimatedNodes = new SparseArray<>();
  private final Map<String, EventNode> mEventMapping = new HashMap<>();
  private final UIImplementation mUIImplementation;
  private final DeviceEventManagerModule.RCTDeviceEventEmitter mEventEmitter;
  private final ReactChoreographer mReactChoreographer;
  private final GuardedFrameCallback mChoreographerCallback;
  private final UIManagerModule.CustomEventNamesResolver mCustomEventNamesResolver;
  private final AtomicBoolean mCallbackPosted = new AtomicBoolean();
  private final NoopNode mNoopNode;
  private final ReactContext mContext;
  private final UIManagerModule mUIManager;

  private List<OnAnimationFrame> mFrameCallbacks = new ArrayList<>();
  private ConcurrentLinkedQueue<Event> mEventQueue = new ConcurrentLinkedQueue<>();
  private boolean mWantRunUpdates;

  public double currentFrameTimeMs;
  public final UpdateContext updateContext;
  public Set<String> uiProps = Collections.emptySet();
  public Set<String> nativeProps = Collections.emptySet();

  private final class NativeUpdateOperation {
    public int mViewTag;
    public WritableMap mNativeProps;
    public NativeUpdateOperation(int viewTag, WritableMap nativeProps) {
      mViewTag = viewTag;
      mNativeProps = nativeProps;
    }
  }
  private Queue<NativeUpdateOperation> mOperationsInBatch = new LinkedList<>();

  public NodesManager(ReactContext context) {
    mContext = context;
    mUIManager = context.getNativeModule(UIManagerModule.class);
    updateContext = new UpdateContext();
    mUIImplementation = mUIManager.getUIImplementation();
    mCustomEventNamesResolver = mUIManager.getDirectEventNamesResolver();
    mUIManager.getEventDispatcher().addListener(this);

    mEventEmitter = context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);

    mReactChoreographer = ReactChoreographer.getInstance();
    mChoreographerCallback = new GuardedFrameCallback(context) {
      @Override
      protected void doFrameGuarded(long frameTimeNanos) {
        onAnimationFrame(frameTimeNanos);
      }
    };

    mNoopNode = new NoopNode(this);
  }

  public void onHostPause() {
    if (mCallbackPosted.get()) {
      stopUpdatingOnAnimationFrame();
      mCallbackPosted.set(true);
    }
  }

  public void onHostResume() {
    if (mCallbackPosted.getAndSet(false)) {
      startUpdatingOnAnimationFrame();
    }
  }

  private void startUpdatingOnAnimationFrame() {
    if (!mCallbackPosted.getAndSet(true)) {
      mReactChoreographer.postFrameCallback(
              ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE,
              mChoreographerCallback);
    }
  }

  private void stopUpdatingOnAnimationFrame() {
    if (mCallbackPosted.getAndSet(false)) {
      mReactChoreographer.removeFrameCallback(
              ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE,
              mChoreographerCallback);
    }
  }

  private void onAnimationFrame(long frameTimeNanos) {
    currentFrameTimeMs = frameTimeNanos / 1000000.;

    while (!mEventQueue.isEmpty()) {
      handleEvent(mEventQueue.poll());
    }

    if (!mFrameCallbacks.isEmpty()) {
      List<OnAnimationFrame> frameCallbacks = mFrameCallbacks;
      mFrameCallbacks = new ArrayList<>(frameCallbacks.size());
      for (int i = 0, size = frameCallbacks.size(); i < size; i++) {
        frameCallbacks.get(i).onAnimationFrame();
      }
    }

    if (mWantRunUpdates) {
      Node.runUpdates(updateContext);
    }

    if (!mOperationsInBatch.isEmpty()) {
      final Queue<NativeUpdateOperation> copiedOperationsQueue = mOperationsInBatch;
      mOperationsInBatch = new LinkedList<>();
      mContext.runOnNativeModulesQueueThread(
              new GuardedRunnable(mContext) {
                @Override
                public void runGuarded() {
                  boolean shouldDispatchUpdates = UIManagerReanimatedHelper.isOperationQueueEmpty(mUIImplementation);
                  while (!copiedOperationsQueue.isEmpty()) {
                    NativeUpdateOperation op = copiedOperationsQueue.remove();
                    ReactShadowNode shadowNode = mUIImplementation.resolveShadowNode(op.mViewTag);
                    if (shadowNode != null) {
                      mUIManager.updateView(op.mViewTag, shadowNode.getViewClass(), op.mNativeProps);
                    }
                  }
                  if (shouldDispatchUpdates) {
                    mUIImplementation.dispatchViewUpdates(-1); // no associated batchId
                  }
                }
              });
    }

    mCallbackPosted.set(false);
    mWantRunUpdates = false;

    if (!mFrameCallbacks.isEmpty() || !mEventQueue.isEmpty()) {
      // enqueue next frame
      startUpdatingOnAnimationFrame();
    }
  }

  /**
   * Null-safe way of getting node's value. If node is not present we return 0. This also matches
   * iOS behavior when the app won't just crash.
   */
  public Object getNodeValue(int nodeID) {
    Node node = mAnimatedNodes.get(nodeID);
    if (node != null) {
      return node.value();
    }
    return ZERO;
  }

  /**
   * Null-safe way of getting node reference. This method always returns non-null instance. If the
   * node is not present we try to return a "no-op" node that allows for "set" calls and always
   * returns 0 as a value.
   */
  public <T extends Node> T findNodeById(int id, Class<T> type) {
    Node node = mAnimatedNodes.get(id);
    if (node == null) {
      if (type == Node.class || type == ValueNode.class) {
        return (T) mNoopNode;
      }
      throw new IllegalArgumentException("Requested node with id " + id + " of type " + type +
              " cannot be found");
    }
    if (type.isInstance(node)) {
      return (T) node;
    }
    throw new IllegalArgumentException("Node with id " + id + " is of incompatible type " +
            node.getClass() + ", requested type was " + type);
  }

  public void createNode(int nodeID, ReadableMap config) {
    if (mAnimatedNodes.get(nodeID) != null) {
      throw new JSApplicationIllegalArgumentException("Animated node with ID " + nodeID +
              " already exists");
    }
    String type = config.getString("type");
    final Node node;
    if ("props".equals(type)) {
      node = new PropsNode(nodeID, config, this, mUIImplementation);
    } else if ("style".equals(type)) {
      node = new StyleNode(nodeID, config, this);
    } else if ("transform".equals(type)) {
      node = new TransformNode(nodeID, config, this);
    } else if ("value".equals(type)) {
      node = new ValueNode(nodeID, config, this);
    } else if ("block".equals(type)) {
      node = new BlockNode(nodeID, config, this);
    } else if ("cond".equals(type)) {
      node = new CondNode(nodeID, config, this);
    } else if ("op".equals(type)) {
      node = new OperatorNode(nodeID, config, this);
    } else if ("set".equals(type)) {
      node = new SetNode(nodeID, config, this);
    } else if ("debug".equals(type)) {
      node = new DebugNode(nodeID, config, this);
    } else if ("clock".equals(type)) {
      node = new ClockNode(nodeID, config, this);
    } else if ("clockStart".equals(type)) {
      node = new ClockOpNode.ClockStartNode(nodeID, config, this);
    } else if ("clockStop".equals(type)) {
      node = new ClockOpNode.ClockStopNode(nodeID, config, this);
    } else if ("clockTest".equals(type)) {
      node = new ClockOpNode.ClockTestNode(nodeID, config, this);
    } else if ("call".equals(type)) {
      node = new JSCallNode(nodeID, config, this);
    } else if ("bezier".equals(type)) {
      node = new BezierNode(nodeID, config, this);
    } else if ("event".equals(type)) {
      node = new EventNode(nodeID, config, this);
    } else if ("always".equals(type)) {
      node = new AlwaysNode(nodeID, config, this);
    } else if ("concat".equals(type)) {
      node = new ConcatNode(nodeID, config, this);
    } else {
      throw new JSApplicationIllegalArgumentException("Unsupported node type: " + type);
    }
    mAnimatedNodes.put(nodeID, node);
  }

  public void dropNode(int tag) {
    mAnimatedNodes.remove(tag);
  }

  public void connectNodes(int parentID, int childID) {
    Node parentNode = mAnimatedNodes.get(parentID);
    if (parentNode == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with ID " + parentID +
              " does not exists");
    }
    Node childNode = mAnimatedNodes.get(childID);
    if (childNode == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with ID " + childID +
              " does not exists");
    }
    parentNode.addChild(childNode);
  }

  public void disconnectNodes(int parentID, int childID) {
    Node parentNode = mAnimatedNodes.get(parentID);
    if (parentNode == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with ID " + parentID +
              " does not exists");
    }
    Node childNode = mAnimatedNodes.get(childID);
    if (childNode == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with ID " + childID +
              " does not exists");
    }
    parentNode.removeChild(childNode);
  }

  public void connectNodeToView(int nodeID, int viewTag) {
    Node node = mAnimatedNodes.get(nodeID);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with ID " + nodeID +
              " does not exists");
    }
    if (!(node instanceof PropsNode)) {
      throw new JSApplicationIllegalArgumentException("Animated node connected to view should be" +
              "of type " + PropsNode.class.getName());
    }
    ((PropsNode) node).connectToView(viewTag);
  }

  public void disconnectNodeFromView(int nodeID, int viewTag) {
    Node node = mAnimatedNodes.get(nodeID);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with ID " + nodeID +
              " does not exists");
    }
    if (!(node instanceof PropsNode)) {
      throw new JSApplicationIllegalArgumentException("Animated node connected to view should be" +
              "of type " + PropsNode.class.getName());
    }
    ((PropsNode) node).disconnectFromView(viewTag);
  }

  public void enqueueUpdateViewOnNativeThread(int viewTag, WritableMap nativeProps) {
    mOperationsInBatch.add(new NativeUpdateOperation(viewTag, nativeProps));
  }

  public void attachEvent(int viewTag, String eventName, int eventNodeID) {
    String key = viewTag + eventName;

    EventNode node = (EventNode) mAnimatedNodes.get(eventNodeID);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException("Event node " + eventNodeID + " does not exists");
    }
    if (mEventMapping.containsKey(key)) {
      throw new JSApplicationIllegalArgumentException("Event handler already set for the given view and event type");
    }

    mEventMapping.put(key, node);
  }

  public void detachEvent(int viewTag, String eventName, int eventNodeID) {
    String key = viewTag + eventName;
    mEventMapping.remove(key);
  }

  public void configureProps(Set<String> nativePropsSet, Set<String> uiPropsSet) {
    nativeProps = nativePropsSet;
    uiProps = uiPropsSet;
  }

  public void postRunUpdatesAfterAnimation() {
    mWantRunUpdates = true;
    startUpdatingOnAnimationFrame();
  }

  public void postOnAnimation(OnAnimationFrame onAnimationFrame) {
    mFrameCallbacks.add(onAnimationFrame);
    startUpdatingOnAnimationFrame();
  }

  @Override
  public void onEventDispatch(Event event) {
    // Events can be dispatched from any thread so we have to make sure handleEvent is run from the
    // UI thread.
    if (UiThreadUtil.isOnUiThread()) {
      handleEvent(event);
    } else {
      mEventQueue.offer(event);
      startUpdatingOnAnimationFrame();
    }
  }

  private void handleEvent(Event event) {
    if (!mEventMapping.isEmpty()) {
      // If the event has a different name in native convert it to it's JS name.
      String eventName = mCustomEventNamesResolver.resolveCustomEventName(event.getEventName());
      int viewTag = event.getViewTag();
      String key = viewTag + eventName;
      EventNode node = mEventMapping.get(key);
      if (node != null) {
        event.dispatch(node);
      }
    }
  }

  public void sendEvent(String name, WritableMap body) {
    mEventEmitter.emit(name, body);
  }
}
