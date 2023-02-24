package com.swmansion.reanimated;

import static java.lang.Float.NaN;

import android.util.SparseArray;
import android.view.View;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.GuardedRunnable;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.uimanager.GuardedFrameCallback;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.UIImplementation;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.UIManagerReanimatedHelper;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.EventDispatcherListener;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.swmansion.reanimated.layoutReanimation.AnimationsManager;
import com.swmansion.reanimated.nodes.AlwaysNode;
import com.swmansion.reanimated.nodes.BezierNode;
import com.swmansion.reanimated.nodes.BlockNode;
import com.swmansion.reanimated.nodes.CallFuncNode;
import com.swmansion.reanimated.nodes.ClockNode;
import com.swmansion.reanimated.nodes.ClockOpNode;
import com.swmansion.reanimated.nodes.ConcatNode;
import com.swmansion.reanimated.nodes.CondNode;
import com.swmansion.reanimated.nodes.DebugNode;
import com.swmansion.reanimated.nodes.EventNode;
import com.swmansion.reanimated.nodes.FunctionNode;
import com.swmansion.reanimated.nodes.JSCallNode;
import com.swmansion.reanimated.nodes.Node;
import com.swmansion.reanimated.nodes.NoopNode;
import com.swmansion.reanimated.nodes.OperatorNode;
import com.swmansion.reanimated.nodes.ParamNode;
import com.swmansion.reanimated.nodes.PropsNode;
import com.swmansion.reanimated.nodes.SetNode;
import com.swmansion.reanimated.nodes.StyleNode;
import com.swmansion.reanimated.nodes.TransformNode;
import com.swmansion.reanimated.nodes.ValueNode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.annotation.Nullable;

public class NodesManager implements EventDispatcherListener {

  private static final Double ZERO = Double.valueOf(0);

  public void scrollTo(int viewTag, double x, double y, boolean animated) {
    View view;
    try {
      view = mUIManager.resolveView(viewTag);
    } catch (IllegalViewOperationException e) {
      e.printStackTrace();
      return;
    }
    NativeMethodsHelper.scrollTo(view, x, y, animated);
  }

  public float[] measure(int viewTag) {
    View view;
    try {
      view = mUIManager.resolveView(viewTag);
    } catch (IllegalViewOperationException e) {
      e.printStackTrace();
      return (new float[] {NaN, NaN, NaN, NaN, NaN, NaN});
    }
    return NativeMethodsHelper.measure(view);
  }

  public interface OnAnimationFrame {
    void onAnimationFrame(double timestampMs);
  }

  private AnimationsManager mAnimationManager = null;
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
  private ConcurrentLinkedQueue<CopiedEvent> mEventQueue = new ConcurrentLinkedQueue<>();
  private boolean mWantRunUpdates;

  public double currentFrameTimeMs;
  public final UpdateContext updateContext;
  public Set<String> uiProps = Collections.emptySet();
  public Set<String> nativeProps = Collections.emptySet();

  public NativeProxy getNativeProxy() {
    return mNativeProxy;
  }

  private NativeProxy mNativeProxy;

  public AnimationsManager getAnimationsManager() {
    return mAnimationManager;
  }

  public void onCatalystInstanceDestroy() {
    if (mAnimationManager != null) {
      mAnimationManager.onCatalystInstanceDestroy();
    }

    if (mNativeProxy != null) {
      mNativeProxy.onCatalystInstanceDestroy();
      mNativeProxy = null;
    }
  }

  public void initWithContext(ReactApplicationContext reactApplicationContext) {
    mNativeProxy = new NativeProxy(reactApplicationContext);
    mAnimationManager.setScheduler(getNativeProxy().getScheduler());
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
  private boolean mTryRunBatchUpdatesSynchronously = false;

  public NodesManager(ReactContext context) {
    mContext = context;
    mUIManager = context.getNativeModule(UIManagerModule.class);
    updateContext = new UpdateContext();
    mUIImplementation = mUIManager.getUIImplementation();
    mCustomEventNamesResolver = mUIManager.getDirectEventNamesResolver();
    mEventEmitter = context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class);

    mReactChoreographer = ReactChoreographer.getInstance();
    mChoreographerCallback =
        new GuardedFrameCallback(context) {
          @Override
          protected void doFrameGuarded(long frameTimeNanos) {
            onAnimationFrame(frameTimeNanos);
          }
        };

    mNoopNode = new NoopNode(this);

    // We register as event listener at the end, because we pass `this` and we haven't finished
    // contructing an object yet.
    // This lead to a crash described in
    // https://github.com/software-mansion/react-native-reanimated/issues/604 which was caused by
    // Nodes Manager being constructed on UI thread and registering for events.
    // Events are handled in the native modules thread in the `onEventDispatch()` method.
    // This method indirectly uses `mChoreographerCallback` which was created after event
    // registration, creating race condition
    mUIManager.getEventDispatcher().addListener(this);

    mAnimationManager = new AnimationsManager(mContext, mUIImplementation, mUIManager);
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
          ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE, mChoreographerCallback);
    }
  }

  private void stopUpdatingOnAnimationFrame() {
    if (mCallbackPosted.getAndSet(false)) {
      mReactChoreographer.removeFrameCallback(
          ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE, mChoreographerCallback);
    }
  }

  private void performOperations() {
    if (!mOperationsInBatch.isEmpty()) {
      final Queue<NativeUpdateOperation> copiedOperationsQueue = mOperationsInBatch;
      mOperationsInBatch = new LinkedList<>();
      final boolean trySynchronously = mTryRunBatchUpdatesSynchronously;
      mTryRunBatchUpdatesSynchronously = false;
      final Semaphore semaphore = new Semaphore(0);
      mContext.runOnNativeModulesQueueThread(
          new GuardedRunnable(mContext.getExceptionHandler()) {
            @Override
            public void runGuarded() {
              boolean queueWasEmpty =
                  UIManagerReanimatedHelper.isOperationQueueEmpty(mUIImplementation);
              boolean shouldDispatchUpdates = trySynchronously && queueWasEmpty;
              if (!shouldDispatchUpdates) {
                semaphore.release();
              }
              while (!copiedOperationsQueue.isEmpty()) {
                NativeUpdateOperation op = copiedOperationsQueue.remove();
                ReactShadowNode shadowNode = mUIImplementation.resolveShadowNode(op.mViewTag);
                if (shadowNode != null) {
                  mUIManager.updateView(op.mViewTag, shadowNode.getViewClass(), op.mNativeProps);
                }
              }
              if (queueWasEmpty) {
                mUIImplementation.dispatchViewUpdates(-1); // no associated batchId
              }
              if (shouldDispatchUpdates) {
                semaphore.release();
              }
            }
          });
      if (trySynchronously) {
        while (true) {
          try {
            semaphore.acquire();
            break;
          } catch (InterruptedException e) {
            // noop
          }
        }
      }
    }
  }

  private void onAnimationFrame(long frameTimeNanos) {
    currentFrameTimeMs = frameTimeNanos / 1000000.;

    while (!mEventQueue.isEmpty()) {
      CopiedEvent copiedEvent = mEventQueue.poll();
      handleEvent(copiedEvent.getTargetTag(), copiedEvent.getEventName(), copiedEvent.getPayload());
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
    performOperations();

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
      throw new IllegalArgumentException(
          "Requested node with id " + id + " of type " + type + " cannot be found");
    }
    if (type.isInstance(node)) {
      return (T) node;
    }
    throw new IllegalArgumentException(
        "Node with id "
            + id
            + " is of incompatible type "
            + node.getClass()
            + ", requested type was "
            + type);
  }

  public void createNode(int nodeID, ReadableMap config) {
    if (mAnimatedNodes.get(nodeID) != null) {
      throw new JSApplicationIllegalArgumentException(
          "Animated node with ID " + nodeID + " already exists");
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
      throw new JSApplicationIllegalArgumentException(
          "Animated node with ID " + childID + " does not exists");
    }
    parentNode.addChild(childNode);
  }

  public void disconnectNodes(int parentID, int childID) {
    Node parentNode = mAnimatedNodes.get(parentID);
    Node childNode = mAnimatedNodes.get(childID);
    if (childNode == null) {
      throw new JSApplicationIllegalArgumentException(
          "Animated node with ID " + childID + " does not exists");
    }
    parentNode.removeChild(childNode);
  }

  public void connectNodeToView(int nodeID, int viewTag) {
    Node node = mAnimatedNodes.get(nodeID);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException(
          "Animated node with ID " + nodeID + " does not exists");
    }
    if (!(node instanceof PropsNode)) {
      throw new JSApplicationIllegalArgumentException(
          "Animated node connected to view should be" + "of type " + PropsNode.class.getName());
    }
    ((PropsNode) node).connectToView(viewTag);
  }

  public void disconnectNodeFromView(int nodeID, int viewTag) {
    Node node = mAnimatedNodes.get(nodeID);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException(
          "Animated node with ID " + nodeID + " does not exists");
    }
    if (!(node instanceof PropsNode)) {
      throw new JSApplicationIllegalArgumentException(
          "Animated node connected to view should be" + "of type " + PropsNode.class.getName());
    }
    ((PropsNode) node).disconnectFromView(viewTag);
  }

  public void enqueueUpdateViewOnNativeThread(
      int viewTag, WritableMap nativeProps, boolean trySynchronously) {
    if (trySynchronously) {
      mTryRunBatchUpdatesSynchronously = true;
    }
    mOperationsInBatch.add(new NativeUpdateOperation(viewTag, nativeProps));
  }

  public void attachEvent(int viewTag, String eventName, int eventNodeID) {
    String key = viewTag + eventName;

    EventNode node = (EventNode) mAnimatedNodes.get(eventNodeID);
    if (node == null) {
      throw new JSApplicationIllegalArgumentException(
          "Event node " + eventNodeID + " does not exists");
    }
    if (mEventMapping.containsKey(key)) {
      throw new JSApplicationIllegalArgumentException(
          "Event handler already set for the given view and event type");
    }

    mEventMapping.put(key, node);
  }

  public void detachEvent(int viewTag, String eventName, int eventNodeID) {
    String key = viewTag + eventName;
    mEventMapping.remove(key);
  }

  public void configureProps(Set<String> uiPropsSet, Set<String> nativePropsSet) {
    uiProps = uiPropsSet;
    nativeProps = nativePropsSet;
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
      performOperations();
    } else {
      boolean shouldSaveEvent = false;
      String eventName = mCustomEventNamesResolver.resolveCustomEventName(event.getEventName());
      int viewTag = event.getViewTag();
      String key = viewTag + eventName;

      shouldSaveEvent |=
          (mCustomEventHandler != null
              && mNativeProxy != null
              && mNativeProxy.isAnyHandlerWaitingForEvent(key));
      if (shouldSaveEvent) {
        mEventQueue.offer(new CopiedEvent(event));
      }
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

  private void handleEvent(int targetTag, String eventName, @Nullable WritableMap event) {
    if (mCustomEventHandler != null) {
      mCustomEventHandler.receiveEvent(targetTag, eventName, event);
    }

    String key = targetTag + eventName;

    if (!mEventMapping.isEmpty()) {
      EventNode node = mEventMapping.get(key);
      if (node != null) {
        node.receiveEvent(targetTag, eventName, event);
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
      } else if (nativeProps.contains(key)) {
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
        enqueueUpdateViewOnNativeThread(viewTag, newNativeProps, true);
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
    String result =
        "error: unknown propName " + propName + ", currently supported: opacity, zIndex";
    if (propName.equals("opacity")) {
      Float opacity = view.getAlpha();
      result = Float.toString(opacity);
    } else if (propName.equals("zIndex")) {
      Float zIndex = view.getElevation();
      result = Float.toString(zIndex);
    }
    return result;
  }

  private static WritableMap copyReadableMap(ReadableMap map) {
    WritableMap copy = Arguments.createMap();
    copy.merge(map);
    return copy;
  }

  private static WritableArray copyReadableArray(ReadableArray array) {
    WritableArray copy = Arguments.createArray();
    for (int i = 0; i < array.size(); i++) {
      ReadableType type = array.getType(i);
      switch (type) {
        case Boolean:
          copy.pushBoolean(array.getBoolean(i));
          break;
        case String:
          copy.pushString(array.getString(i));
          break;
        case Null:
          copy.pushNull();
          break;
        case Number:
          copy.pushDouble(array.getDouble(i));
          break;
        case Map:
          copy.pushMap(copyReadableMap(array.getMap(i)));
          break;
        case Array:
          copy.pushArray(copyReadableArray(array.getArray(i)));
          break;
        default:
          throw new IllegalStateException("Unknown type of ReadableArray");
      }
    }
    return copy;
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
      if (!(value instanceof WritableArray)) {
        propMap.putArray(key, copyReadableArray((ReadableArray) value));
      } else {
        propMap.putArray(key, (ReadableArray) value);
      }
    } else if (value instanceof ReadableMap) {
      if (!(value instanceof WritableMap)) {
        propMap.putMap(key, copyReadableMap((ReadableMap) value));
      } else {
        propMap.putMap(key, (ReadableMap) value);
      }
    } else {
      throw new IllegalStateException("Unknown type of animated value");
    }
  }
}
