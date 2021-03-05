package abi39_0_0.host.exp.exponent.modules.api.reanimated;

import android.util.SparseArray;
import android.view.View;

import abi39_0_0.com.facebook.react.bridge.Arguments;
import abi39_0_0.com.facebook.react.bridge.Callback;
import abi39_0_0.com.facebook.react.bridge.GuardedRunnable;
import abi39_0_0.com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import abi39_0_0.com.facebook.react.bridge.JavaOnlyMap;
import abi39_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi39_0_0.com.facebook.react.bridge.ReactContext;
import abi39_0_0.com.facebook.react.bridge.ReadableArray;
import abi39_0_0.com.facebook.react.bridge.ReadableMap;
import abi39_0_0.com.facebook.react.bridge.UiThreadUtil;
import abi39_0_0.com.facebook.react.bridge.WritableMap;
import abi39_0_0.com.facebook.react.modules.core.DeviceEventManagerModule;
import abi39_0_0.com.facebook.react.modules.core.ReactChoreographer;
import abi39_0_0.com.facebook.react.uimanager.GuardedFrameCallback;
import abi39_0_0.com.facebook.react.uimanager.IllegalViewOperationException;
import abi39_0_0.com.facebook.react.uimanager.ReactShadowNode;
import abi39_0_0.com.facebook.react.uimanager.ReactStylesDiffMap;
import abi39_0_0.com.facebook.react.uimanager.UIImplementation;
import abi39_0_0.com.facebook.react.uimanager.UIManagerModule;
import abi39_0_0.com.facebook.react.uimanager.UIManagerReanimatedHelper;
import abi39_0_0.com.facebook.react.uimanager.events.Event;
import abi39_0_0.com.facebook.react.uimanager.events.EventDispatcherListener;
import abi39_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.AlwaysNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.BezierNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.BlockNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.CallFuncNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.ClockNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.ClockOpNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.ConcatNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.CondNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.DebugNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.EventNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.FunctionNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.JSCallNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.Node;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.NoopNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.OperatorNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.ParamNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.PropsNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.SetNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.StyleNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.TransformNode;
import abi39_0_0.host.exp.exponent.modules.api.reanimated.nodes.ValueNode;

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

  public void scrollTo(int viewTag, double x, double y, boolean animated) {
    View view;
    try {
      view = mUIManager.resolveView(viewTag);
    } catch(IllegalViewOperationException e) {
      e.printStackTrace();
      return;
    }
    NativeMethodsHelper.scrollTo(view, x, y, animated);
  }

  public float[] measure(int viewTag) {
    View view;
    try {
      view = mUIManager.resolveView(viewTag);
    } catch(IllegalViewOperationException e) {
      e.printStackTrace();
      return (new float[]{});
    }
    return NativeMethodsHelper.measure(view);
  }

  public interface OnAnimationFrame {
    void onAnimationFrame(double timestampMs);
  }

  private final SparseArray<Node> mAnimatedNodes = new SparseArray<>();
  private final Map<String, EventNode> mEventMapping = new HashMap<>();
  private final UIImplementation mUIImplementation;
  private final DeviceEventManagerModule.RCTDeviceEventEmitter mEventEmitter;
  private final ReactChoreographer mReactChoreographer;
  private final GuardedFrameCallback mChoreographerCallback;
  protected final UIManagerModule.CustomEventNamesResolver mCustomEventNamesResolver;
  private final AtomicBoolean mCallbackPosted = new AtomicBoolean();
  private final NoopNode mNoopNode;
  private final ReactContext mContext;
  private final UIManagerModule mUIManager;

  private RCTEventEmitter mCustomEventHandler;
  private List<OnAnimationFrame> mFrameCallbacks = new ArrayList<>();
  private ConcurrentLinkedQueue<Event> mEventQueue = new ConcurrentLinkedQueue<>();
  private boolean mWantRunUpdates;

  public double currentFrameTimeMs;
  public final UpdateContext updateContext;
  public Set<String> uiProps = Collections.emptySet();
  public Set<String> nativeProps = Collections.emptySet();

  private NativeProxy mNativeProxy;

  public void onCatalystInstanceDestroy() {
    if (mNativeProxy != null) {
      mNativeProxy.onCatalystInstanceDestroy();
      mNativeProxy = null;
    }
  }

  public void initWithContext(ReactApplicationContext reactApplicationContext) {
    mNativeProxy = new NativeProxy(reactApplicationContext);
  }

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
    mEventEmitter = context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);

    mReactChoreographer = ReactChoreographer.getInstance();
    mChoreographerCallback = new GuardedFrameCallback(context) {
      @Override
      protected void doFrameGuarded(long frameTimeNanos) {
        onAnimationFrame(frameTimeNanos);
      }
    };

    mNoopNode = new NoopNode(this);

    // We register as event listener at the end, because we pass `this` and we haven't finished contructing an object yet.
    // This lead to a crash described in https://github.com/software-mansion/react-native-reanimated/issues/604 which was caused by Nodes Manager being constructed on UI thread and registering for events.
    // Events are handled in the native modules thread in the `onEventDispatch()` method.
    // This method indirectly uses `mChoreographerCallback` which was created after event registration, creating race condition
    mUIManager.getEventDispatcher().addListener(this);
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

  public void startUpdatingOnAnimationFrame() {
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
        frameCallbacks.get(i).onAnimationFrame(currentFrameTimeMs);
      }
    }

    if (mWantRunUpdates) {
      Node.runUpdates(updateContext);
    }

    if (!mOperationsInBatch.isEmpty()) {
      final Queue<NativeUpdateOperation> copiedOperationsQueue = mOperationsInBatch;
      mOperationsInBatch = new LinkedList<>();
      mContext.runOnNativeModulesQueueThread(
              // FIXME replace `mContext` with `mContext.getExceptionHandler()` after RN 0.59 support is dropped
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
    } else if ("param".equals(type)) {
      node = new ParamNode(nodeID, config, this);
    } else if ("func".equals(type)) {
      node = new FunctionNode(nodeID, config, this);
    } else if ("callfunc".equals(type)) {
      node = new CallFuncNode(nodeID, config, this);
    } else {
      throw new JSApplicationIllegalArgumentException("Unsupported node type: " + type);
    }
    mAnimatedNodes.put(nodeID, node);
  }

  public void dropNode(int tag) {
    Node node = mAnimatedNodes.get(tag);
    if (node != null) {
      node.onDrop();
    }
    mAnimatedNodes.remove(tag);
  }

  public void connectNodes(int parentID, int childID) {
    Node parentNode = mAnimatedNodes.get(parentID);
    Node childNode = mAnimatedNodes.get(childID);
    if (childNode == null) {
      throw new JSApplicationIllegalArgumentException("Animated node with ID " + childID +
              " does not exists");
    }
    parentNode.addChild(childNode);
  }

  public void disconnectNodes(int parentID, int childID) {
    Node parentNode = mAnimatedNodes.get(parentID);
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

  public void getValue(int nodeID, Callback callback) {
    callback.invoke(mAnimatedNodes.get(nodeID).value());
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
    // If the event has a different name in native, convert it to it's JS name.
    String eventName = mCustomEventNamesResolver.resolveCustomEventName(event.getEventName());
    int viewTag = event.getViewTag();
    String key = viewTag + eventName;

    if (mCustomEventHandler != null) {
      event.dispatch(mCustomEventHandler);
    }

    if (!mEventMapping.isEmpty()) {
      EventNode node = mEventMapping.get(key);
      if (node != null) {
        event.dispatch(node);
      }
    }
  }

  public UIManagerModule.CustomEventNamesResolver getEventNameResolver() {
    return mCustomEventNamesResolver;
  }

  public void registerEventHandler(RCTEventEmitter handler) {
    mCustomEventHandler = handler;
  }

  public void sendEvent(String name, WritableMap body) {
    mEventEmitter.emit(name, body);
  }

  public void setValue(int nodeID, Double newValue) {
    Node node = mAnimatedNodes.get(nodeID);
    if (node != null) {
      ((ValueNode) node).setValue(newValue);
    }
  }

  public void updateProps(int viewTag, Map<String, Object> props) {
    // TODO: update PropsNode to use this method instead of its own way of updating props
    boolean hasUIProps = false;
    boolean hasNativeProps = false;
    boolean hasJSProps = false;
    JavaOnlyMap newUIProps = new JavaOnlyMap();
    WritableMap newJSProps = Arguments.createMap();
    WritableMap newNativeProps = Arguments.createMap();


    for (Map.Entry<String, Object> entry : props.entrySet()) {
      String key = entry.getKey();
      Object value = entry.getValue();
      if (uiProps.contains(key)) {
        hasUIProps = true;
        addProp(newUIProps, key, value);
      } else if(nativeProps.contains(key)) {
        hasNativeProps = true;
        addProp(newNativeProps, key, value);
      } else {
        hasJSProps = true;
        addProp(newJSProps, key, value);
      }
    }

    if (viewTag != View.NO_ID) {
      if (hasUIProps) {
        mUIImplementation.synchronouslyUpdateViewOnUIThread(
                viewTag, new ReactStylesDiffMap(newUIProps));
      }
      if (hasNativeProps) {
        enqueueUpdateViewOnNativeThread(viewTag, newNativeProps);
      }
      if (hasJSProps) {
        WritableMap evt = Arguments.createMap();
        evt.putInt("viewTag", viewTag);
        evt.putMap("props", newJSProps);
        sendEvent("onReanimatedPropsChange", evt);
      }
    }
  }

  public String obtainProp(int viewTag, String propName) {
    View view = mUIManager.resolveView(viewTag);
    String result = "error: unknown propName " + propName + ", currently supported: opacity, zIndex";
    if (propName.equals("opacity")) {
      Float opacity = view.getAlpha();
      result = Float.toString(opacity);
    } else if (propName.equals("zIndex")) {
      Float zIndex = view.getElevation();
      result = Float.toString(zIndex);
    }
    return result;
  }

  private static void addProp(WritableMap propMap, String key, Object value) {
    if (value == null) {
      propMap.putNull(key);
    } else if (value instanceof Double) {
      propMap.putDouble(key, (Double) value);
    } else if (value instanceof Integer) {
      propMap.putInt(key, (Integer) value);
    } else if (value instanceof Number) {
      propMap.putDouble(key, ((Number) value).doubleValue());
    } else if (value instanceof Boolean) {
      propMap.putBoolean(key, (Boolean) value);
    } else if (value instanceof String) {
      propMap.putString(key, (String) value);
    } else if (value instanceof ReadableArray) {
      propMap.putArray(key, (ReadableArray) value);
    } else if (value instanceof ReadableMap) {
      propMap.putMap(key, (ReadableMap) value);
    } else {
      throw new IllegalStateException("Unknown type of animated value");
    }
  }
}
