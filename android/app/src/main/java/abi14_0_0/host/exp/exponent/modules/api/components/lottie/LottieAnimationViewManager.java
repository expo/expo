package abi14_0_0.host.exp.exponent.modules.api.components.lottie;

import android.os.Handler;
import android.os.Looper;
import android.support.v4.view.ViewCompat;

import android.util.Log;
import com.airbnb.lottie.LottieAnimationView;
import abi14_0_0.com.facebook.react.bridge.ReadableArray;
import abi14_0_0.com.facebook.react.bridge.ReadableMap;
import abi14_0_0.com.facebook.react.common.MapBuilder;
import abi14_0_0.com.facebook.react.uimanager.SimpleViewManager;
import abi14_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi14_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;

class LottieAnimationViewManager extends SimpleViewManager<LottieAnimationView> {
  private static final String TAG = LottieAnimationViewManager.class.getSimpleName();
  private static final String REACT_CLASS = "LottieAnimationView";
  private static final int VERSION = 1;
  private static final int COMMAND_PLAY = 1;
  private static final int COMMAND_RESET = 2;

  @Override public Map<String, Object> getExportedViewConstants() {
    return MapBuilder.<String, Object>builder()
        .put("VERSION", VERSION)
        .build();
  }

  @Override public String getName() {
    return REACT_CLASS;
  }

  @Override public LottieAnimationView createViewInstance(ThemedReactContext context) {
    return new LottieAnimationView(context);
  }

  @Override public Map<String, Integer> getCommandsMap() {
    return MapBuilder.of(
        "play", COMMAND_PLAY,
        "reset", COMMAND_RESET
    );
  }

  @Override
  public void receiveCommand(final LottieAnimationView view, int commandId, ReadableArray args) {
    switch (commandId) {
      case COMMAND_PLAY: {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
          @Override public void run() {
            if (ViewCompat.isAttachedToWindow(view)) {
              view.setProgress(0f);
              view.playAnimation();
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

  // TODO: cache strategy

  @ReactProp(name = "sourceName")
  public void setSourceName(LottieAnimationView view, String name) {
    view.setAnimation(name);
  }

  @ReactProp(name = "sourceJson")
  public void setSourceJson(LottieAnimationView view, ReadableMap json) {
    try {
        view.setAnimation(new JSONReadableMap(json));
    } catch (Exception e) {
      // TODO: expose this to the user better. maybe an `onError` event?
      Log.e(TAG,"setSourceJsonError", e);
    }
  }

  @ReactProp(name = "progress")
  public void setProgress(LottieAnimationView view, float progress) {
    view.setProgress(progress);
  }

  @ReactProp(name = "speed")
  public void setSpeed(LottieAnimationView view, double speed) {
    // TODO?
  }

  @ReactProp(name = "loop")
  public void setLoop(LottieAnimationView view, boolean loop) {
    view.loop(loop);
  }
}
