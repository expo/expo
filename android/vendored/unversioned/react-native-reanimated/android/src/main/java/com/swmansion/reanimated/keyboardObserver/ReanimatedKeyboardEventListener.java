package com.swmansion.reanimated.keyboardObserver;

import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.FrameLayout;
import androidx.annotation.NonNull;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsAnimationCompat;
import androidx.core.view.WindowInsetsCompat;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.PixelUtil;
import com.swmansion.reanimated.BuildConfig;
import com.swmansion.reanimated.nativeProxy.KeyboardEventDataUpdater;
import java.lang.ref.WeakReference;
import java.util.HashMap;
import java.util.List;

public class ReanimatedKeyboardEventListener {
  enum KeyboardState {
    UNKNOWN(0),
    OPENING(1),
    OPEN(2),
    CLOSING(3),
    CLOSED(4);

    private final int value;

    KeyboardState(int value) {
      this.value = value;
    }

    public int asInt() {
      return value;
    }
  }

  private final WeakReference<ReactApplicationContext> reactContext;
  private int nextListenerId = 0;
  private KeyboardState state;
  private final HashMap<Integer, KeyboardEventDataUpdater> listeners = new HashMap<>();
  private boolean isStatusBarTranslucent = false;

  public ReanimatedKeyboardEventListener(WeakReference<ReactApplicationContext> reactContext) {
    this.reactContext = reactContext;
  }

  private View getRootView() {
    return reactContext.get().getCurrentActivity().getWindow().getDecorView();
  }

  private void setupWindowInsets() {
    View rootView = getRootView();
    WindowCompat.setDecorFitsSystemWindows(
        reactContext.get().getCurrentActivity().getWindow(), false);
    ViewCompat.setOnApplyWindowInsetsListener(
        rootView,
        (v, insets) -> {
          int paddingBottom = 0;
          if (!BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
              && BuildConfig.REACT_NATIVE_MINOR_VERSION < 70) {
            paddingBottom = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
          }
          int paddingTop = insets.getInsets(WindowInsetsCompat.Type.systemBars()).top;
          View content =
              rootView.getRootView().findViewById(androidx.appcompat.R.id.action_bar_root);

          FrameLayout.LayoutParams params =
              new FrameLayout.LayoutParams(
                  FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
          if (isStatusBarTranslucent) {
            params.setMargins(0, 0, 0, 0);
          } else {
            params.setMargins(0, paddingTop, 0, paddingBottom);
          }
          content.setLayoutParams(params);
          return insets;
        });
  }

  private void updateKeyboard(int keyboardHeight) {
    for (KeyboardEventDataUpdater listener : listeners.values()) {
      listener.keyboardEventDataUpdater(state.asInt(), keyboardHeight);
    }
  }

  private class WindowInsetsCallback extends WindowInsetsAnimationCompat.Callback {
    private int keyboardHeight = 0;

    public WindowInsetsCallback() {
      super(WindowInsetsAnimationCompat.Callback.DISPATCH_MODE_CONTINUE_ON_SUBTREE);
    }

    @NonNull
    @Override
    public WindowInsetsAnimationCompat.BoundsCompat onStart(
        @NonNull WindowInsetsAnimationCompat animation,
        @NonNull WindowInsetsAnimationCompat.BoundsCompat bounds) {
      state = keyboardHeight == 0 ? KeyboardState.OPENING : KeyboardState.CLOSING;
      updateKeyboard(keyboardHeight);
      return super.onStart(animation, bounds);
    }

    @NonNull
    @Override
    public WindowInsetsCompat onProgress(
        @NonNull WindowInsetsCompat insets,
        @NonNull List<WindowInsetsAnimationCompat> runningAnimations) {

      keyboardHeight =
          (int)
              PixelUtil.toDIPFromPixel(
                  Math.max(
                      0,
                      insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
                          - insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom));
      updateKeyboard(keyboardHeight);
      return insets;
    }

    @Override
    public void onEnd(@NonNull WindowInsetsAnimationCompat animation) {
      state = keyboardHeight == 0 ? KeyboardState.CLOSED : KeyboardState.OPEN;
      updateKeyboard(keyboardHeight);
    }
  }

  private void setUpCallbacks() {
    View rootView = getRootView();
    new Handler(Looper.getMainLooper()).post(this::setupWindowInsets);
    ViewCompat.setWindowInsetsAnimationCallback(rootView, new WindowInsetsCallback());
  }

  public int subscribeForKeyboardEvents(
      KeyboardEventDataUpdater updater, boolean isStatusBarTranslucent) {
    int listenerId = nextListenerId++;
    if (listeners.isEmpty()) {
      this.isStatusBarTranslucent = isStatusBarTranslucent;
      setUpCallbacks();
    }
    listeners.put(listenerId, updater);
    return listenerId;
  }

  private void bringBackWindowInsets() {
    WindowCompat.setDecorFitsSystemWindows(
        reactContext.get().getCurrentActivity().getWindow(), !isStatusBarTranslucent);
    ViewCompat.setOnApplyWindowInsetsListener(getRootView(), null);
    ViewCompat.setWindowInsetsAnimationCallback(getRootView(), null);
    View content =
        getRootView().getRootView().findViewById(androidx.appcompat.R.id.action_bar_root);

    FrameLayout.LayoutParams params =
        new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
    params.setMargins(0, 0, 0, 0);
    content.setLayoutParams(params);
  }

  private void removeCallbacks() {
    View rootView = getRootView();
    new Handler(Looper.getMainLooper()).post(this::bringBackWindowInsets);
    ViewCompat.setWindowInsetsAnimationCallback(rootView, null);
  }

  public void unsubscribeFromKeyboardEvents(int listenerId) {
    listeners.remove(listenerId);
    if (listeners.isEmpty()) {
      removeCallbacks();
    }
  }
}
