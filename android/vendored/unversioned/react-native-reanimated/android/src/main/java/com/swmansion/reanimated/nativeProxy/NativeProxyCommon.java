package com.swmansion.reanimated.nativeProxy;

import android.content.ContentResolver;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.Log;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.ReactApplication;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeArray;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.soloader.SoLoader;
import com.swmansion.common.GestureHandlerStateManager;
import com.swmansion.reanimated.AndroidUIScheduler;
import com.swmansion.reanimated.BuildConfig;
import com.swmansion.reanimated.NativeProxy;
import com.swmansion.reanimated.NodesManager;
import com.swmansion.reanimated.ReanimatedModule;
import com.swmansion.reanimated.Utils;
import com.swmansion.reanimated.keyboardObserver.ReanimatedKeyboardEventListener;
import com.swmansion.reanimated.layoutReanimation.AnimationsManager;
import com.swmansion.reanimated.layoutReanimation.LayoutAnimations;
import com.swmansion.reanimated.sensor.ReanimatedSensorContainer;
import com.swmansion.reanimated.sensor.ReanimatedSensorType;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public abstract class NativeProxyCommon {
  static {
    SoLoader.loadLibrary("reanimated");
  }

  protected NodesManager mNodesManager;
  protected final WeakReference<ReactApplicationContext> mContext;
  protected AndroidUIScheduler mAndroidUIScheduler;
  private ReanimatedSensorContainer reanimatedSensorContainer;
  private final GestureHandlerStateManager gestureHandlerStateManager;
  private ReanimatedKeyboardEventListener reanimatedKeyboardEventListener;
  private Long firstUptime = SystemClock.uptimeMillis();
  private boolean slowAnimationsEnabled = false;
  protected String cppVersion = null;

  protected NativeProxyCommon(ReactApplicationContext context) {
    mAndroidUIScheduler = new AndroidUIScheduler(context);
    mContext = new WeakReference<>(context);
    reanimatedSensorContainer = new ReanimatedSensorContainer(mContext);
    reanimatedKeyboardEventListener = new ReanimatedKeyboardEventListener(mContext);
    addDevMenuOption();

    GestureHandlerStateManager tempHandlerStateManager;
    try {
      Class<NativeModule> gestureHandlerModuleClass =
          (Class<NativeModule>)
              Class.forName("com.swmansion.gesturehandler.react.RNGestureHandlerModule");
      tempHandlerStateManager =
          (GestureHandlerStateManager) context.getNativeModule(gestureHandlerModuleClass);
    } catch (ClassCastException | ClassNotFoundException e) {
      tempHandlerStateManager = null;
    }
    gestureHandlerStateManager = tempHandlerStateManager;
  }

  protected native void installJSIBindings();

  public AndroidUIScheduler getAndroidUIScheduler() {
    return mAndroidUIScheduler;
  }

  private void toggleSlowAnimations() {
    slowAnimationsEnabled = !slowAnimationsEnabled;
    if (slowAnimationsEnabled) {
      firstUptime = SystemClock.uptimeMillis();
    }
  }

  private void addDevMenuOption() {
    // In Expo, `ApplicationContext` is not an instance of `ReactApplication`
    if (mContext.get().getApplicationContext() instanceof ReactApplication) {
      final DevSupportManager devSupportManager =
          ((ReactApplication) mContext.get().getApplicationContext())
              .getReactNativeHost()
              .getReactInstanceManager()
              .getDevSupportManager();

      devSupportManager.addCustomDevOption(
          "Toggle slow animations (Reanimated)", this::toggleSlowAnimations);
    }
  }

  @DoNotStrip
  public void requestRender(AnimationFrameCallback callback) {
    mNodesManager.postOnAnimation(callback);
  }

  @DoNotStrip
  public String getReanimatedJavaVersion() {
    return BuildConfig.REANIMATED_VERSION_JAVA;
  }

  @DoNotStrip
  @SuppressWarnings("unused")
  // It turns out it's pretty difficult to set a member of a class
  // instance through JNI so we decided to use a setter instead.
  protected void setCppVersion(String version) {
    cppVersion = version;
  }

  protected void checkCppVersion() {
    if (cppVersion == null) {
      throw new RuntimeException(
          "[Reanimated] Java side failed to resolve C++ code version. "
              + "See https://docs.swmansion.com/react-native-reanimated/docs/guides/troubleshooting#java-side-failed-to-resolve-c-code-version for more information.");
    }
    String javaVersion = getReanimatedJavaVersion();
    if (!cppVersion.equals(javaVersion)) {
      throw new RuntimeException(
          "[Reanimated] Mismatch between Java code version and C++ code version ("
              + javaVersion
              + " vs. "
              + cppVersion
              + " respectively). See "
              + "https://docs.swmansion.com/react-native-reanimated/docs/guides/troubleshooting#mismatch-between-java-code-version-and-c-code-version for more information.");
    }
  }

  @DoNotStrip
  public void updateProps(int viewTag, Map<String, Object> props) {
    mNodesManager.updateProps(viewTag, props);
  }

  @DoNotStrip
  public void synchronouslyUpdateUIProps(int viewTag, ReadableMap uiProps) {
    mNodesManager.synchronouslyUpdateUIProps(viewTag, uiProps);
  }

  @DoNotStrip
  public String obtainProp(int viewTag, String propName) {
    return mNodesManager.obtainProp(viewTag, propName);
  }

  @DoNotStrip
  public void scrollTo(int viewTag, double x, double y, boolean animated) {
    mNodesManager.scrollTo(viewTag, x, y, animated);
  }

  @DoNotStrip
  public void dispatchCommand(int viewTag, String commandId, ReadableArray commandArgs) {
    mNodesManager.dispatchCommand(viewTag, commandId, commandArgs);
  }

  @DoNotStrip
  public void setGestureState(int handlerTag, int newState) {
    if (gestureHandlerStateManager != null) {
      gestureHandlerStateManager.setGestureHandlerState(handlerTag, newState);
    }
  }

  @DoNotStrip
  public long getAnimationTimestamp() {
    if (slowAnimationsEnabled) {
      final long ANIMATIONS_DRAG_FACTOR = 10;
      return this.firstUptime
          + (SystemClock.uptimeMillis() - this.firstUptime) / ANIMATIONS_DRAG_FACTOR;
    } else {
      return SystemClock.uptimeMillis();
    }
  }

  @DoNotStrip
  public float[] measure(int viewTag) {
    return mNodesManager.measure(viewTag);
  }

  @DoNotStrip
  public void configureProps(ReadableNativeArray uiProps, ReadableNativeArray nativeProps) {
    Set<String> uiPropsSet = convertProps(uiProps);
    Set<String> nativePropsSet = convertProps(nativeProps);
    mNodesManager.configureProps(uiPropsSet, nativePropsSet);
  }

  private Set<String> convertProps(ReadableNativeArray props) {
    Set<String> propsSet = new HashSet<>();
    ArrayList<Object> propsList = props.toArrayList();
    for (int i = 0; i < propsList.size(); i++) {
      propsSet.add((String) propsList.get(i));
    }
    return propsSet;
  }

  @DoNotStrip
  public void registerEventHandler(EventHandler handler) {
    handler.mCustomEventNamesResolver = mNodesManager.getEventNameResolver();
    mNodesManager.registerEventHandler(handler);
  }

  @DoNotStrip
  public int registerSensor(int sensorType, int interval, SensorSetter setter) {
    return reanimatedSensorContainer.registerSensor(
        ReanimatedSensorType.getInstanceById(sensorType), interval, setter);
  }

  @DoNotStrip
  public void unregisterSensor(int sensorId) {
    reanimatedSensorContainer.unregisterSensor(sensorId);
  }

  @DoNotStrip
  public int subscribeForKeyboardEvents(
      KeyboardEventDataUpdater keyboardEventDataUpdater, boolean isStatusBarTranslucent) {
    return reanimatedKeyboardEventListener.subscribeForKeyboardEvents(
        keyboardEventDataUpdater, isStatusBarTranslucent);
  }

  @DoNotStrip
  public void unsubscribeFromKeyboardEvents(int listenerId) {
    reanimatedKeyboardEventListener.unsubscribeFromKeyboardEvents(listenerId);
  }

  protected abstract HybridData getHybridData();

  public void onCatalystInstanceDestroy() {
    mAndroidUIScheduler.deactivate();
    getHybridData().resetNative();
  }

  public void prepareLayoutAnimations(LayoutAnimations layoutAnimations) {
    if (Utils.isChromeDebugger) {
      Log.w("[REANIMATED]", "You can not use LayoutAnimation with enabled Chrome Debugger");
      return;
    }
    mNodesManager = mContext.get().getNativeModule(ReanimatedModule.class).getNodesManager();

    AnimationsManager animationsManager =
        mContext
            .get()
            .getNativeModule(ReanimatedModule.class)
            .getNodesManager()
            .getAnimationsManager();

    animationsManager.setNativeMethods(NativeProxy.createNativeMethodsHolder(layoutAnimations));
  }

  @DoNotStrip
  public boolean getIsReducedMotion() {
    ContentResolver mContentResolver = mContext.get().getContentResolver();
    String rawValue =
        Settings.Global.getString(mContentResolver, Settings.Global.TRANSITION_ANIMATION_SCALE);
    float parsedValue = rawValue != null ? Float.parseFloat(rawValue) : 1f;
    return parsedValue == 0f;
  }

  @DoNotStrip
  void maybeFlushUIUpdatesQueue() {
    if (!mNodesManager.isAnimationRunning()) {
      mNodesManager.performOperations();
    }
  }
}
