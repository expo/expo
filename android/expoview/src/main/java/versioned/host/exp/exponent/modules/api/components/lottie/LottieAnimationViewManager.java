package versioned.host.exp.exponent.modules.api.components.lottie;

import android.animation.Animator;
import android.content.Context;
import android.content.ContextWrapper;
import android.os.Handler;
import android.os.Looper;
import androidx.core.view.ViewCompat;
import android.widget.ImageView;
import android.view.View.OnAttachStateChangeListener;
import android.view.View;

import com.airbnb.lottie.LottieAnimationView;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import java.util.Map;
import java.util.WeakHashMap;

class LottieAnimationViewManager extends SimpleViewManager<LottieAnimationView> {
  private static final String TAG = LottieAnimationViewManager.class.getSimpleName();

  private static final String REACT_CLASS = "LottieAnimationView";
  private static final int VERSION = 1;
  private static final int COMMAND_PLAY = 1;
  private static final int COMMAND_RESET = 2;

  private Map<LottieAnimationView, LottieAnimationViewPropertyManager> propManagersMap = new WeakHashMap<>();

  @Override public Map<String, Object> getExportedViewConstants() {
    return MapBuilder.<String, Object>builder()
        .put("VERSION", VERSION)
        .build();
  }

  @Override public String getName() {
    return REACT_CLASS;
  }

  @Override public LottieAnimationView createViewInstance(ThemedReactContext context) {
    final LottieAnimationView view = new LottieAnimationView(context);
    view.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
    view.addAnimatorListener(new Animator.AnimatorListener() {
      @Override
      public void onAnimationStart(Animator animation) {}

      @Override
      public void onAnimationEnd(Animator animation) {
        sendOnAnimationFinishEvent(view, false);
      }

      @Override
      public void onAnimationCancel(Animator animation) {
        sendOnAnimationFinishEvent(view, true);
      }

      @Override
      public void onAnimationRepeat(Animator animation) {}
    });
    return view;
  }

  private void sendOnAnimationFinishEvent(final LottieAnimationView view, boolean isCancelled) {
    WritableMap event = Arguments.createMap();
    event.putBoolean("isCancelled", isCancelled);
    Context ctx = view.getContext();
    ReactContext reactContext = null;
    while (ctx instanceof ContextWrapper) {
      if (ctx instanceof ReactContext) {
        reactContext = (ReactContext)ctx;
        break;
      }
      ctx = ((ContextWrapper)ctx).getBaseContext();
    }
    if (reactContext != null) {
      reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(
          view.getId(),
          "animationFinish",
          event);
    }
  }

  @Override public Map getExportedCustomBubblingEventTypeConstants() {
    return MapBuilder.builder()
        .put(
            "animationFinish",
            MapBuilder.of(
                "phasedRegistrationNames",
                MapBuilder.of("bubbled", "onAnimationFinish")))
        .build();
  }

  @Override public Map<String, Integer> getCommandsMap() {
    return MapBuilder.of(
        "play", COMMAND_PLAY,
        "reset", COMMAND_RESET
    );
  }

  @Override
  public void receiveCommand(final LottieAnimationView view, int commandId, final ReadableArray args) {
    switch (commandId) {
      case COMMAND_PLAY: {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
          @Override public void run() {
            int startFrame = args.getInt(0);
            int endFrame = args.getInt(1);
            if (startFrame != -1 && endFrame != -1) {
              view.setMinAndMaxFrame(args.getInt(0), args.getInt(1));
            }
            if (ViewCompat.isAttachedToWindow(view)) {
              view.setProgress(0f);
              view.playAnimation();
            } else {
              view.addOnAttachStateChangeListener(new OnAttachStateChangeListener() {
                   @Override
                   public void onViewAttachedToWindow(View v) {
                      LottieAnimationView view = (LottieAnimationView)v;
                      view.setProgress(0f);
                      view.playAnimation();
                      view.removeOnAttachStateChangeListener(this);
                   }

                   @Override
                   public void onViewDetachedFromWindow(View v) {
                      view.removeOnAttachStateChangeListener(this);
                   }
               });
            }
          }
        });
      }
      break;
      case COMMAND_RESET: {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
          @Override public void run() {
            if (ViewCompat.isAttachedToWindow(view)) {
              view.cancelAnimation();
              view.setProgress(0f);
            }
          }
        });
      }
      break;
    }
  }

  @ReactProp(name = "sourceName")
  public void setSourceName(LottieAnimationView view, String name) {
    getOrCreatePropertyManager(view).setAnimationName(name);
  }

  @ReactProp(name = "sourceJson")
  public void setSourceJson(LottieAnimationView view, String json) {
    getOrCreatePropertyManager(view).setAnimationJson(json);
  }

  /**
   *
   * @param view
   * @param name
   */
  @ReactProp(name = "cacheStrategy")
  public void setCacheStrategy(LottieAnimationView view, String name) {
    if (name != null) {
      LottieAnimationView.CacheStrategy strategy = LottieAnimationView.DEFAULT_CACHE_STRATEGY;
      switch (name) {
        case "none":
          strategy = LottieAnimationView.CacheStrategy.None;
          break;
        case "weak":
           strategy = LottieAnimationView.CacheStrategy.Weak;
           break;
        case "strong":
          strategy = LottieAnimationView.CacheStrategy.Strong;
          break;
      }
      getOrCreatePropertyManager(view).setCacheStrategy(strategy);
    }
  }

  @ReactProp(name = "resizeMode")
  public void setResizeMode(LottieAnimationView view, String resizeMode) {
    ImageView.ScaleType mode = null;
    if ("cover".equals(resizeMode)) {
      mode = ImageView.ScaleType.CENTER_CROP;
    } else if ("contain".equals(resizeMode)) {
      mode = ImageView.ScaleType.CENTER_INSIDE;
    } else if ("center".equals(resizeMode)) {
      mode = ImageView.ScaleType.CENTER;
    }
    getOrCreatePropertyManager(view).setScaleType(mode);
  }

  @ReactProp(name = "progress")
  public void setProgress(LottieAnimationView view, float progress) {
    getOrCreatePropertyManager(view).setProgress(progress);
  }

  @ReactProp(name = "speed")
  public void setSpeed(LottieAnimationView view, double speed) {
    getOrCreatePropertyManager(view).setSpeed((float)speed);
  }

  @ReactProp(name = "loop")
  public void setLoop(LottieAnimationView view, boolean loop) {
    getOrCreatePropertyManager(view).setLoop(loop);
  }

  @ReactProp(name = "hardwareAccelerationAndroid")
  public void setHardwareAcceleration(LottieAnimationView view, boolean use) {
    getOrCreatePropertyManager(view).setUseHardwareAcceleration(use);
  }

  @ReactProp(name = "imageAssetsFolder")
  public void setImageAssetsFolder(LottieAnimationView view, String imageAssetsFolder) {
    getOrCreatePropertyManager(view).setImageAssetsFolder(imageAssetsFolder);
  }

  @ReactProp(name = "enableMergePathsAndroidForKitKatAndAbove")
  public void setEnableMergePaths(LottieAnimationView view, boolean enableMergePaths) {
    getOrCreatePropertyManager(view).setEnableMergePaths(enableMergePaths);
  }

  @Override
  protected void onAfterUpdateTransaction(LottieAnimationView view) {
    super.onAfterUpdateTransaction(view);
    getOrCreatePropertyManager(view).commitChanges();
  }

  private LottieAnimationViewPropertyManager getOrCreatePropertyManager(LottieAnimationView view) {
    LottieAnimationViewPropertyManager result = propManagersMap.get(view);
    if (result == null) {
      result = new LottieAnimationViewPropertyManager(view);
      propManagersMap.put(view, result);
    }
    return result;
  }
}
