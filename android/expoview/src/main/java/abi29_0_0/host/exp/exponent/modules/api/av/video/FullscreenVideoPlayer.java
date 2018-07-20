package abi29_0_0.host.exp.exponent.modules.api.av.video;

import android.app.Dialog;
import android.os.Handler;
import android.support.annotation.NonNull;
import android.view.Window;
import android.view.WindowManager;
import android.widget.FrameLayout;

import abi29_0_0.com.facebook.react.bridge.ReactContext;
import abi29_0_0.com.facebook.react.uimanager.ThemedReactContext;

import java.lang.ref.WeakReference;

import abi29_0_0.host.exp.exponent.modules.api.KeepAwakeModule;
import abi29_0_0.host.exp.exponent.modules.api.av.player.PlayerData;

public class FullscreenVideoPlayer extends Dialog {
  private static class KeepScreenOnUpdater implements Runnable {
    private final static long UPDATE_KEEP_SCREEN_ON_FLAG_MS = 200;
    private final WeakReference<FullscreenVideoPlayer> mFullscreenPlayer;

    KeepScreenOnUpdater(FullscreenVideoPlayer player) {
      mFullscreenPlayer = new WeakReference<>(player);
    }

    @Override
    public void run() {
      FullscreenVideoPlayer fullscreenVideoPlayer = mFullscreenPlayer.get();
      if (fullscreenVideoPlayer != null) {
        final Window window = fullscreenVideoPlayer.getWindow();
        if (window != null) {
          boolean isPlaying =
              fullscreenVideoPlayer.mVideoView.getStatus().hasKey(PlayerData.STATUS_IS_PLAYING_KEY_PATH)
                  && fullscreenVideoPlayer.mVideoView.getStatus().getBoolean(PlayerData.STATUS_IS_PLAYING_KEY_PATH);
          KeepAwakeModule keepAwakeModule = fullscreenVideoPlayer.mReactContext.getNativeModule(KeepAwakeModule.class);
          if (isPlaying || keepAwakeModule.isActivated()) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
          } else {
            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
          }
        }
        fullscreenVideoPlayer.mKeepScreenOnHandler.postDelayed(this, UPDATE_KEEP_SCREEN_ON_FLAG_MS);
      }
    }
  }

  private Handler mKeepScreenOnHandler;
  private Runnable mKeepScreenOnUpdater;

  private FrameLayout mParent;
  private ReactContext mReactContext;
  private final VideoView mVideoView;
  private final FrameLayout mContainerView;
  private WeakReference<FullscreenVideoPlayerPresentationChangeListener> mUpdateListener;

  FullscreenVideoPlayer(@NonNull ThemedReactContext context, VideoView videoView) {
    super(context, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
    mReactContext = context;

    setCancelable(false);

    mVideoView = videoView;

    mContainerView = new FrameLayout(context);
    setContentView(mContainerView, generateDefaultLayoutParams());

    mKeepScreenOnUpdater = new KeepScreenOnUpdater(this);
    mKeepScreenOnHandler = new Handler();
  }

  @Override
  public void onBackPressed() {
    super.onBackPressed();

    if (isShowing()) {
      dismiss();
    }
  }

  @Override
  public void show() {
    final FullscreenVideoPlayerPresentationChangeListener updateListener = mUpdateListener.get();
    if (updateListener != null) {
      updateListener.onFullscreenPlayerWillPresent();
    }

    super.show();
  }

  @Override
  public void dismiss() {
    mVideoView.setOverridingUseNativeControls(null);
    final FullscreenVideoPlayerPresentationChangeListener updateListener = mUpdateListener.get();
    if (updateListener != null) {
      updateListener.onFullscreenPlayerWillDismiss();
    }

    super.dismiss();
  }

  @Override
  protected void onStart() {
    mParent = (FrameLayout) mVideoView.getParent();
    mParent.removeView(mVideoView);

    mContainerView.addView(mVideoView, generateDefaultLayoutParams());

    super.onStart();
  }

  @Override
  public void onAttachedToWindow() {
    super.onAttachedToWindow();
    final FullscreenVideoPlayerPresentationChangeListener updateListener = mUpdateListener.get();
    if (updateListener != null) {
      updateListener.onFullscreenPlayerDidPresent();
    }

    mVideoView.setOverridingUseNativeControls(true);

    mKeepScreenOnHandler.post(mKeepScreenOnUpdater);
  }

  void setUpdateListener(FullscreenVideoPlayerPresentationChangeListener listener) {
    mUpdateListener = new WeakReference<>(listener);
  }

  @Override
  protected void onStop() {
    mKeepScreenOnHandler.removeCallbacks(mKeepScreenOnUpdater);
    mContainerView.removeView(mVideoView);
    mParent.addView(mVideoView, generateDefaultLayoutParams());

    mParent.requestLayout();
    mParent = null;

    super.onStop();

    final FullscreenVideoPlayerPresentationChangeListener updateListener = mUpdateListener.get();
    if (updateListener != null) {
      updateListener.onFullscreenPlayerDidDismiss();
    }
  }

  private FrameLayout.LayoutParams generateDefaultLayoutParams() {
    return new FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT
    );
  }
}
