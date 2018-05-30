package versioned.host.exp.exponent.modules.api.components.gesturehandler.react;

import android.content.Context;
import android.view.MotionEvent;
import android.view.View;

import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.UIBlock;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.events.EventDispatcher;
import versioned.host.exp.exponent.modules.api.components.gesturehandler.FlingGestureHandler;
import versioned.host.exp.exponent.modules.api.components.gesturehandler.GestureHandler;
import versioned.host.exp.exponent.modules.api.components.gesturehandler.LongPressGestureHandler;
import versioned.host.exp.exponent.modules.api.components.gesturehandler.NativeViewGestureHandler;
import versioned.host.exp.exponent.modules.api.components.gesturehandler.OnTouchEventListener;
import versioned.host.exp.exponent.modules.api.components.gesturehandler.PanGestureHandler;
import versioned.host.exp.exponent.modules.api.components.gesturehandler.PinchGestureHandler;
import versioned.host.exp.exponent.modules.api.components.gesturehandler.RotationGestureHandler;
import versioned.host.exp.exponent.modules.api.components.gesturehandler.TapGestureHandler;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.annotation.Nullable;

import static versioned.host.exp.exponent.modules.api.components.gesturehandler.GestureHandler.HIT_SLOP_NONE;

public class RNGestureHandlerModule extends ReactContextBaseJavaModule {

  public static final String MODULE_NAME = "RNGestureHandlerModule";

  private static final String KEY_SHOULD_CANCEL_WHEN_OUTSIDE = "shouldCancelWhenOutside";
  private static final String KEY_ENABLED = "enabled";
  private static final String KEY_HIT_SLOP = "hitSlop";
  private static final String KEY_HIT_SLOP_LEFT = "left";
  private static final String KEY_HIT_SLOP_TOP = "top";
  private static final String KEY_HIT_SLOP_RIGHT = "right";
  private static final String KEY_HIT_SLOP_BOTTOM = "bottom";
  private static final String KEY_HIT_SLOP_VERTICAL = "vertical";
  private static final String KEY_HIT_SLOP_HORIZONTAL = "horizontal";
  private static final String KEY_HIT_SLOP_WIDTH = "width";
  private static final String KEY_HIT_SLOP_HEIGHT = "height";
  private static final String KEY_NATIVE_VIEW_SHOULD_ACTIVATE_ON_START = "shouldActivateOnStart";
  private static final String KEY_NATIVE_VIEW_DISALLOW_INTERRUPTION = "disallowInterruption";
  private static final String KEY_TAP_NUMBER_OF_TAPS = "numberOfTaps";
  private static final String KEY_TAP_MAX_DURATION_MS = "maxDurationMs";
  private static final String KEY_TAP_MAX_DELAY_MS = "maxDelayMs";
  private static final String KEY_TAP_MAX_DELTA_X = "maxDeltaX";
  private static final String KEY_TAP_MAX_DELTA_Y = "maxDeltaY";
  private static final String KEY_TAP_MAX_DIST = "maxDist";
  private static final String KEY_TAP_MIN_POINTERS = "minPointers";
  private static final String KEY_LONG_PRESS_MIN_DURATION_MS = "minDurationMs";
  private static final String KEY_LONG_PRESS_MAX_DIST = "maxDist";
  private static final String KEY_PAN_MIN_DELTA_X = "minDeltaX";
  private static final String KEY_PAN_MIN_DELTA_Y = "minDeltaY";
  private static final String KEY_PAN_MAX_DELTA_X = "maxDeltaX";
  private static final String KEY_PAN_MAX_DELTA_Y = "maxDeltaY";
  private static final String KEY_PAN_MIN_OFFSET_X = "minOffsetX";
  private static final String KEY_PAN_MIN_OFFSET_Y = "minOffsetY";
  private static final String KEY_PAN_MIN_DIST = "minDist";
  private static final String KEY_PAN_MIN_VELOCITY = "minVelocity";
  private static final String KEY_PAN_MIN_VELOCITY_X = "minVelocityX";
  private static final String KEY_PAN_MIN_VELOCITY_Y = "minVelocityY";
  private static final String KEY_PAN_MIN_POINTERS = "minPointers";
  private static final String KEY_PAN_MAX_POINTERS = "maxPointers";
  private static final String KEY_PAN_AVG_TOUCHES = "avgTouches";
  private static final String KEY_NUMBER_OF_POINTERS = "numberOfPointers";
  private static final String KEY_DIRECTION= "direction";

  private abstract static class HandlerFactory<T extends GestureHandler>
          implements RNGestureHandlerEventDataExtractor<T> {

    public abstract Class<T> getType();

    public abstract String getName();

    public abstract T create(Context context);

    public void configure(T handler, ReadableMap config) {
      if (config.hasKey(KEY_SHOULD_CANCEL_WHEN_OUTSIDE)) {
        handler.setShouldCancelWhenOutside(config.getBoolean(KEY_SHOULD_CANCEL_WHEN_OUTSIDE));
      }
      if (config.hasKey(KEY_ENABLED)) {
        handler.setEnabled(config.getBoolean(KEY_ENABLED));
      }
      if (config.hasKey(KEY_HIT_SLOP)) {
        handleHitSlopProperty(handler, config);
      }
    }

    @Override
    public void extractEventData(T handler, WritableMap eventData) {
      eventData.putDouble("numberOfPointers", handler.getNumberOfPointers());
    }
  }

  private static class NativeViewGestureHandlerFactory extends
          HandlerFactory<NativeViewGestureHandler> {
    @Override
    public Class<NativeViewGestureHandler> getType() {
      return NativeViewGestureHandler.class;
    }

    @Override
    public String getName() {
      return "NativeViewGestureHandler";
    }

    @Override
    public NativeViewGestureHandler create(Context context) {
      return new NativeViewGestureHandler();
    }

    @Override
    public void configure(NativeViewGestureHandler handler, ReadableMap config) {
      super.configure(handler, config);
      if (config.hasKey(KEY_NATIVE_VIEW_SHOULD_ACTIVATE_ON_START)) {
        handler.setShouldActivateOnStart(
                config.getBoolean(KEY_NATIVE_VIEW_SHOULD_ACTIVATE_ON_START));
      }
      if (config.hasKey(KEY_NATIVE_VIEW_DISALLOW_INTERRUPTION)) {
        handler.setDisallowInterruption(config.getBoolean(KEY_NATIVE_VIEW_DISALLOW_INTERRUPTION));
      }
    }

    @Override
    public void extractEventData(NativeViewGestureHandler handler, WritableMap eventData) {
      super.extractEventData(handler, eventData);
      eventData.putBoolean("pointerInside", handler.isWithinBounds());
    }
  }

  private static class TapGestureHandlerFactory extends HandlerFactory<TapGestureHandler> {
    @Override
    public Class<TapGestureHandler> getType() {
      return TapGestureHandler.class;
    }

    @Override
    public String getName() {
      return "TapGestureHandler";
    }

    @Override
    public TapGestureHandler create(Context context) {
      return new TapGestureHandler();
    }

    @Override
    public void configure(TapGestureHandler handler, ReadableMap config) {
      super.configure(handler, config);
      if (config.hasKey(KEY_TAP_NUMBER_OF_TAPS)) {
        handler.setNumberOfTaps(config.getInt(KEY_TAP_NUMBER_OF_TAPS));
      }
      if (config.hasKey(KEY_TAP_MAX_DURATION_MS)) {
        handler.setMaxDurationMs(config.getInt(KEY_TAP_MAX_DURATION_MS));
      }
      if (config.hasKey(KEY_TAP_MAX_DELAY_MS)) {
        handler.setMaxDelayMs(config.getInt(KEY_TAP_MAX_DELAY_MS));
      }
      if (config.hasKey(KEY_TAP_MAX_DELTA_X)) {
        handler.setMaxDx(PixelUtil.toPixelFromDIP(config.getDouble(KEY_TAP_MAX_DELTA_X)));
      }
      if (config.hasKey(KEY_TAP_MAX_DELTA_Y)) {
        handler.setMaxDy(PixelUtil.toPixelFromDIP(config.getDouble(KEY_TAP_MAX_DELTA_Y)));
      }
      if (config.hasKey(KEY_TAP_MAX_DIST)) {
        handler.setMaxDist(PixelUtil.toPixelFromDIP(config.getDouble(KEY_TAP_MAX_DIST)));
      }
      if (config.hasKey(KEY_TAP_MIN_POINTERS)) {
        handler.setMinNumberOfPointers(config.getInt(KEY_TAP_MIN_POINTERS));
      }
    }

    @Override
    public void extractEventData(TapGestureHandler handler, WritableMap eventData) {
      super.extractEventData(handler, eventData);
      eventData.putDouble("x", PixelUtil.toDIPFromPixel(handler.getLastRelativePositionX()));
      eventData.putDouble("y", PixelUtil.toDIPFromPixel(handler.getLastRelativePositionY()));
      eventData.putDouble("absoluteX", PixelUtil.toDIPFromPixel(handler.getLastAbsolutePositionX()));
      eventData.putDouble("absoluteY", PixelUtil.toDIPFromPixel(handler.getLastAbsolutePositionY()));
    }
  }

  private static class LongPressGestureHandlerFactory extends
          HandlerFactory<LongPressGestureHandler> {
    @Override
    public Class<LongPressGestureHandler> getType() {
      return LongPressGestureHandler.class;
    }

    @Override
    public String getName() {
      return "LongPressGestureHandler";
    }

    @Override
    public LongPressGestureHandler create(Context context) {
      return new LongPressGestureHandler(context);
    }

    @Override
    public void configure(LongPressGestureHandler handler, ReadableMap config) {
      super.configure(handler, config);
      if (config.hasKey(KEY_LONG_PRESS_MIN_DURATION_MS)) {
        handler.setMinDurationMs(config.getInt(KEY_LONG_PRESS_MIN_DURATION_MS));
      }
      if (config.hasKey(KEY_LONG_PRESS_MAX_DIST)) {
        handler.setMaxDist(PixelUtil.toPixelFromDIP(config.getDouble(KEY_LONG_PRESS_MAX_DIST)));
      }
    }
  }

  private static class PanGestureHandlerFactory extends HandlerFactory<PanGestureHandler> {
    @Override
    public Class<PanGestureHandler> getType() {
      return PanGestureHandler.class;
    }

    @Override
    public String getName() {
      return "PanGestureHandler";
    }

    @Override
    public PanGestureHandler create(Context context) {
      return new PanGestureHandler(context);
    }

    @Override
    public void configure(PanGestureHandler handler, ReadableMap config) {
      super.configure(handler, config);
      boolean hasCustomActivationCriteria = false;
      if (config.hasKey(KEY_PAN_MIN_DELTA_X)) {
        handler.setMinDx(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_MIN_DELTA_X)));
        hasCustomActivationCriteria = true;
      }
      if (config.hasKey(KEY_PAN_MIN_DELTA_Y)) {
        handler.setMinDy(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_MIN_DELTA_Y)));
        hasCustomActivationCriteria = true;
      }
      if (config.hasKey(KEY_PAN_MAX_DELTA_X)) {
        handler.setMaxDx(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_MAX_DELTA_X)));
      }
      if (config.hasKey(KEY_PAN_MAX_DELTA_Y)) {
        handler.setMaxDy(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_MAX_DELTA_Y)));
      }
      if (config.hasKey(KEY_PAN_MIN_OFFSET_X)) {
        handler.setMinOffsetX(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_MIN_OFFSET_X)));
        hasCustomActivationCriteria = true;
      }
      if (config.hasKey(KEY_PAN_MIN_OFFSET_Y)) {
        handler.setMinOffsetY(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_MIN_OFFSET_Y)));
        hasCustomActivationCriteria = true;
      }

      if (config.hasKey(KEY_PAN_MIN_VELOCITY)) {
        // This value is actually in DPs/ms, but we can use the same function as for converting
        // from DPs to pixels as the unit we're converting is in the numerator
        handler.setMinVelocity(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_MIN_VELOCITY)));
        hasCustomActivationCriteria = true;
      }
      if (config.hasKey(KEY_PAN_MIN_VELOCITY_X)) {
        handler.setMinVelocityX(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_MIN_VELOCITY_X)));
        hasCustomActivationCriteria = true;
      }
      if (config.hasKey(KEY_PAN_MIN_VELOCITY_Y)) {
        handler.setMinVelocityY(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_MIN_VELOCITY_Y)));
        hasCustomActivationCriteria = true;
      }

      // PanGestureHandler sets minDist by default, if there are custom criteria specified we want
      // to reset that setting and use provided criteria instead.
      if (config.hasKey(KEY_PAN_MIN_DIST)) {
        handler.setMinDist(PixelUtil.toPixelFromDIP(config.getDouble(KEY_PAN_MIN_DIST)));
      } else if (hasCustomActivationCriteria) {
        handler.setMinDist(Float.MAX_VALUE);
      }

      if (config.hasKey(KEY_PAN_MIN_POINTERS)) {
        handler.setMinPointers(config.getInt(KEY_PAN_MIN_POINTERS));
      }
      if (config.hasKey(KEY_PAN_MAX_POINTERS)) {
        handler.setMaxPointers(config.getInt(KEY_PAN_MAX_POINTERS));
      }
      if (config.hasKey(KEY_PAN_AVG_TOUCHES)) {
        handler.setAverageTouches(config.getBoolean(KEY_PAN_AVG_TOUCHES));
      }
    }

    @Override
    public void extractEventData(PanGestureHandler handler, WritableMap eventData) {
      super.extractEventData(handler, eventData);
      eventData.putDouble("x", PixelUtil.toDIPFromPixel(handler.getLastRelativePositionX()));
      eventData.putDouble("y", PixelUtil.toDIPFromPixel(handler.getLastRelativePositionY()));
      eventData.putDouble("absoluteX", PixelUtil.toDIPFromPixel(handler.getLastAbsolutePositionX()));
      eventData.putDouble("absoluteY", PixelUtil.toDIPFromPixel(handler.getLastAbsolutePositionY()));
      eventData.putDouble("translationX", PixelUtil.toDIPFromPixel(handler.getTranslationX()));
      eventData.putDouble("translationY", PixelUtil.toDIPFromPixel(handler.getTranslationY()));
      eventData.putDouble("velocityX", PixelUtil.toDIPFromPixel(handler.getVelocityX()));
      eventData.putDouble("velocityY", PixelUtil.toDIPFromPixel(handler.getVelocityY()));
    }
  }

  private static class PinchGestureHandlerFactory extends HandlerFactory<PinchGestureHandler> {
    @Override
    public Class<PinchGestureHandler> getType() {
      return PinchGestureHandler.class;
    }

    @Override
    public String getName() {
      return "PinchGestureHandler";
    }

    @Override
    public PinchGestureHandler create(Context context) {
      return new PinchGestureHandler();
    }

    @Override
    public void extractEventData(PinchGestureHandler handler, WritableMap eventData) {
      super.extractEventData(handler, eventData);
      eventData.putDouble("scale", handler.getScale());
      eventData.putDouble("focalX", PixelUtil.toDIPFromPixel(handler.getFocalPointX()));
      eventData.putDouble("focalY", PixelUtil.toDIPFromPixel(handler.getFocalPointY()));
      eventData.putDouble("velocity", handler.getVelocity());
    }
  }

  private static class FlingGestureHandlerFactory extends HandlerFactory<FlingGestureHandler> {
    @Override
    public Class<FlingGestureHandler> getType() {
      return FlingGestureHandler.class;
    }

    @Override
    public String getName() {
      return "FlingGestureHandler";
    }

    @Override
    public FlingGestureHandler create(Context context) {
      return new FlingGestureHandler();
    }

    @Override
    public void configure(FlingGestureHandler handler, ReadableMap config) {
      super.configure(handler, config);
      if (config.hasKey(KEY_NUMBER_OF_POINTERS)) {
        handler.setNumberOfPointersRequired(config.getInt(KEY_NUMBER_OF_POINTERS));
      }
      if (config.hasKey(KEY_DIRECTION)) {
        handler.setDirection(config.getInt(KEY_DIRECTION));
      }
    }
  }

  private static class RotationGestureHandlerFactory extends HandlerFactory<RotationGestureHandler> {
    @Override
    public Class<RotationGestureHandler> getType() {
      return RotationGestureHandler.class;
    }

    @Override
    public String getName() {
      return "RotationGestureHandler";
    }

    @Override
    public RotationGestureHandler create(Context context) {
      return new RotationGestureHandler();
    }

    @Override
    public void extractEventData(RotationGestureHandler handler, WritableMap eventData) {
      super.extractEventData(handler, eventData);
      eventData.putDouble("rotation", handler.getRotation());
      eventData.putDouble("anchorX", PixelUtil.toDIPFromPixel(handler.getAnchorX()));
      eventData.putDouble("anchorY", PixelUtil.toDIPFromPixel(handler.getAnchorY()));
      eventData.putDouble("velocity", handler.getVelocity());
    }
  }

  private OnTouchEventListener mEventListener = new OnTouchEventListener() {
    @Override
    public void onTouchEvent(GestureHandler handler, MotionEvent event) {
      RNGestureHandlerModule.this.onTouchEvent(handler, event);
    }

    @Override
    public void onStateChange(GestureHandler handler, int newState, int oldState) {
      RNGestureHandlerModule.this.onStateChange(handler, newState, oldState);
    }
  };

  private HandlerFactory[] mHandlerFactories = new HandlerFactory[] {
          new NativeViewGestureHandlerFactory(),
          new TapGestureHandlerFactory(),
          new LongPressGestureHandlerFactory(),
          new PanGestureHandlerFactory(),
          new PinchGestureHandlerFactory(),
          new RotationGestureHandlerFactory(),
          new FlingGestureHandlerFactory()
  };
  private final RNGestureHandlerRegistry mRegistry = new RNGestureHandlerRegistry();

  private RNGestureHandlerInteractionManager mInteractionManager =
          new RNGestureHandlerInteractionManager();
  private List<RNGestureHandlerRootHelper> mRoots = new ArrayList<>();
  private List<Integer> mEnqueuedRootViewInit = new ArrayList<>();

  public RNGestureHandlerModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return MODULE_NAME;
  }

  @ReactMethod
  public void createGestureHandler(
          String handlerName,
          int handlerTag,
          ReadableMap config) {
    for (int i = 0; i < mHandlerFactories.length; i++) {
      HandlerFactory handlerFactory = mHandlerFactories[i];
      if (handlerFactory.getName().equals(handlerName)) {
        GestureHandler handler = handlerFactory.create(getReactApplicationContext());
        handler.setTag(handlerTag);
        handler.setOnTouchEventListener(mEventListener);
        mRegistry.registerHandler(handler);
        mInteractionManager.configureInteractions(handler, config);
        handlerFactory.configure(handler, config);
        return;
      }
    }
    throw new JSApplicationIllegalArgumentException("Invalid handler name " + handlerName);
  }

  @ReactMethod
  public void attachGestureHandler(int handlerTag, int viewTag) {
    tryInitializeHandlerForReactRootView(viewTag);
    if (!mRegistry.attachHandlerToView(handlerTag, viewTag)) {
      throw new JSApplicationIllegalArgumentException(
              "Handler with tag " + handlerTag + " does not exists");
    }
  }

  @ReactMethod
  public void updateGestureHandler(
          int handlerTag,
          ReadableMap config) {
    GestureHandler handler = mRegistry.getHandler(handlerTag);
    if (handler != null) {
      HandlerFactory factory = findFactoryForHandler(handler);
      if (factory != null) {
        mInteractionManager.dropRelationsForHandlerWithTag(handlerTag);
        mInteractionManager.configureInteractions(handler, config);
        factory.configure(handler, config);
      }
    }
  }

  @ReactMethod
  public void dropGestureHandler(int handlerTag) {
    mInteractionManager.dropRelationsForHandlerWithTag(handlerTag);
    mRegistry.dropHandler(handlerTag);
  }

  @ReactMethod
  public void handleSetJSResponder(int viewTag, boolean blockNativeResponder) {
    if (mRegistry != null) {
      RNGestureHandlerRootHelper rootView = findRootHelperForViewAncestor(viewTag);
      if (rootView != null) {
        rootView.handleSetJSResponder(viewTag, blockNativeResponder);
      }
    }
  }

  @ReactMethod
  public void handleClearJSResponder() {
  }

  @Override
  public @Nullable Map getConstants() {
    return MapBuilder.of("State", MapBuilder.of(
            "UNDETERMINED", GestureHandler.STATE_UNDETERMINED,
            "BEGAN", GestureHandler.STATE_BEGAN,
            "ACTIVE", GestureHandler.STATE_ACTIVE,
            "CANCELLED", GestureHandler.STATE_CANCELLED,
            "FAILED", GestureHandler.STATE_FAILED,
            "END", GestureHandler.STATE_END
    ), "Direction", MapBuilder.of(
            "RIGHT", GestureHandler.DIRECTION_RIGHT,
            "LEFT", GestureHandler.DIRECTION_LEFT,
            "UP", GestureHandler.DIRECTION_UP,
            "DOWN", GestureHandler.DIRECTION_DOWN
    ));
  }

  public RNGestureHandlerRegistry getRegistry() {
    return mRegistry;
  }


  @Override
  public void onCatalystInstanceDestroy() {
    mRegistry.dropAllHandlers();
    mInteractionManager.reset();
    synchronized (mRoots) {
      while (!mRoots.isEmpty()) {
        int sizeBefore = mRoots.size();
        RNGestureHandlerRootHelper root = mRoots.get(0);
        ReactRootView reactRootView = root.getRootView();
        if (reactRootView instanceof RNGestureHandlerEnabledRootView) {
          ((RNGestureHandlerEnabledRootView) reactRootView).tearDown();
        } else {
          root.tearDown();
        }
        if (mRoots.size() >= sizeBefore) {
          throw new IllegalStateException("Expected root helper to get unregistered while tearing down");
        }
      }
    }
    super.onCatalystInstanceDestroy();
  }

  private void tryInitializeHandlerForReactRootView(int ancestorViewTag) {
    UIManagerModule uiManager = getReactApplicationContext().getNativeModule(UIManagerModule.class);
    final int rootViewTag = uiManager.resolveRootTagFromReactTag(ancestorViewTag);
    if (rootViewTag < 1) {
      throw new JSApplicationIllegalArgumentException("Could find root view for a given ancestor with tag "
              + ancestorViewTag);
    }
    synchronized (mRoots) {
      for (int i = 0; i < mRoots.size(); i++) {
        RNGestureHandlerRootHelper root = mRoots.get(i);
        if (root.getRootView().getRootViewTag() == rootViewTag) {
          // we have found root helper registered for a given react root, we don't need to
          // initialize a new one then
          return;
        }
      }
    }
    synchronized (mEnqueuedRootViewInit) {
      if (mEnqueuedRootViewInit.contains(rootViewTag)) {
        // root view initialization already enqueued -> we skip
        return;
      }
      mEnqueuedRootViewInit.add(rootViewTag);
    }
    // root helper for a given root tag has not been found, we may wat to check if the root view is
    // an instance of RNGestureHandlerEnabledRootView and then initialize gesture handler with it
    uiManager.addUIBlock(new UIBlock() {
      @Override
      public void execute(NativeViewHierarchyManager nativeViewHierarchyManager) {
        View view = nativeViewHierarchyManager.resolveView(rootViewTag);
        if (view instanceof RNGestureHandlerEnabledRootView) {
          ((RNGestureHandlerEnabledRootView) view).initialize();
        } else {
          // Seems like the root view is something else than RNGestureHandlerEnabledRootView, this
          // is fine though as long as gestureHandlerRootHOC is used in JS
          // FIXME: check and warn about gestureHandlerRootHOC
        }
        synchronized (mEnqueuedRootViewInit) {
          mEnqueuedRootViewInit.remove(new Integer(rootViewTag));
        }
      }
    });
  }

  public void registerRootHelper(RNGestureHandlerRootHelper root) {
    synchronized (mRoots) {
      if (mRoots.contains(root)) {
        throw new IllegalStateException("Root helper" + root + " already registered");
      }
      mRoots.add(root);
    }
  }

  public void unregisterRootHelper(RNGestureHandlerRootHelper root) {
    synchronized (mRoots) {
      mRoots.remove(root);
    }
  }


  private @Nullable RNGestureHandlerRootHelper findRootHelperForViewAncestor(int viewTag) {
    UIManagerModule uiManager = getReactApplicationContext().getNativeModule(UIManagerModule.class);
    int rootViewTag = uiManager.resolveRootTagFromReactTag(viewTag);
    if (rootViewTag < 1) {
      return null;
    }
    synchronized (mRoots) {
      for (int i = 0; i < mRoots.size(); i++) {
        RNGestureHandlerRootHelper root = mRoots.get(i);
        if (root.getRootView().getRootViewTag() == rootViewTag) {
          return root;
        }
      }
    }
    return null;
  }

  private @Nullable HandlerFactory findFactoryForHandler(GestureHandler handler) {
    for (int i = 0; i < mHandlerFactories.length; i++) {
      HandlerFactory factory = mHandlerFactories[i];
      if (factory.getType().equals(handler.getClass())) {
        return factory;
      }
    }
    return null;
  }

  private void onTouchEvent(GestureHandler handler, MotionEvent motionEvent) {
    if (handler.getTag() < 0) {
      // root containers use negative tags, we don't need to dispatch events for them to the JS
      return;
    }
    if (handler.getState() == GestureHandler.STATE_ACTIVE) {
      HandlerFactory handlerFactory = findFactoryForHandler(handler);
      EventDispatcher eventDispatcher = getReactApplicationContext()
              .getNativeModule(UIManagerModule.class)
              .getEventDispatcher();
      RNGestureHandlerEvent event = RNGestureHandlerEvent.obtain(handler, handlerFactory);
      eventDispatcher.dispatchEvent(event);
    }
  }

  private void onStateChange(GestureHandler handler, int newState, int oldState) {
    if (handler.getTag() < 0) {
      // root containers use negative tags, we don't need to dispatch events for them to the JS
      return;
    }
    HandlerFactory handlerFactory = findFactoryForHandler(handler);
    EventDispatcher eventDispatcher = getReactApplicationContext()
            .getNativeModule(UIManagerModule.class)
            .getEventDispatcher();
    RNGestureHandlerStateChangeEvent event = RNGestureHandlerStateChangeEvent.obtain(
            handler,
            newState,
            oldState,
            handlerFactory);
    eventDispatcher.dispatchEvent(event);
  }

  private static void handleHitSlopProperty(GestureHandler handler, ReadableMap config) {
    if (config.getType(KEY_HIT_SLOP) == ReadableType.Number) {
      float hitSlop = PixelUtil.toPixelFromDIP(config.getDouble(KEY_HIT_SLOP));
      handler.setHitSlop(hitSlop, hitSlop, hitSlop, hitSlop, HIT_SLOP_NONE, HIT_SLOP_NONE);
    } else {
      ReadableMap hitSlop = config.getMap(KEY_HIT_SLOP);
      float left = HIT_SLOP_NONE, top = HIT_SLOP_NONE, right = HIT_SLOP_NONE, bottom = HIT_SLOP_NONE;
      float width = HIT_SLOP_NONE, height = HIT_SLOP_NONE;
      if (hitSlop.hasKey(KEY_HIT_SLOP_HORIZONTAL)) {
        float horizontalPad = PixelUtil.toPixelFromDIP(hitSlop.getDouble(KEY_HIT_SLOP_HORIZONTAL));
        left = right = horizontalPad;
      }
      if (hitSlop.hasKey(KEY_HIT_SLOP_VERTICAL)) {
        float verticalPad = PixelUtil.toPixelFromDIP(hitSlop.getDouble(KEY_HIT_SLOP_VERTICAL));
        top = bottom = verticalPad;
      }
      if (hitSlop.hasKey(KEY_HIT_SLOP_LEFT)) {
        left  = PixelUtil.toPixelFromDIP(hitSlop.getDouble(KEY_HIT_SLOP_LEFT));
      }
      if (hitSlop.hasKey(KEY_HIT_SLOP_TOP)) {
        top = PixelUtil.toPixelFromDIP(hitSlop.getDouble(KEY_HIT_SLOP_TOP));
      }
      if (hitSlop.hasKey(KEY_HIT_SLOP_RIGHT)) {
        right = PixelUtil.toPixelFromDIP(hitSlop.getDouble(KEY_HIT_SLOP_RIGHT));
      }
      if (hitSlop.hasKey(KEY_HIT_SLOP_BOTTOM)) {
        bottom = PixelUtil.toPixelFromDIP(hitSlop.getDouble(KEY_HIT_SLOP_BOTTOM));
      }
      if (hitSlop.hasKey(KEY_HIT_SLOP_WIDTH)) {
        width = PixelUtil.toPixelFromDIP(hitSlop.getDouble(KEY_HIT_SLOP_WIDTH));
      }
      if (hitSlop.hasKey(KEY_HIT_SLOP_HEIGHT)) {
        height = PixelUtil.toPixelFromDIP(hitSlop.getDouble(KEY_HIT_SLOP_HEIGHT));
      }
      handler.setHitSlop(left, top, right, bottom, width, height);
    }
  }
}
