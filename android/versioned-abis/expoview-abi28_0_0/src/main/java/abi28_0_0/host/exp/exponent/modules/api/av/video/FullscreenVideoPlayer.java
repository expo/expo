package abi28_0_0.host.exp.exponent.modules.api.av.video;

import android.app.Dialog;
import android.support.annotation.NonNull;
import android.widget.FrameLayout;

import abi28_0_0.com.facebook.react.uimanager.ThemedReactContext;

import java.lang.ref.WeakReference;

public class FullscreenVideoPlayer extends Dialog {
  private FrameLayout mParent;
  private final VideoView mVideoView;
  private final FrameLayout mContainerView;
  private WeakReference<FullscreenVideoPlayerPresentationChangeListener> mUpdateListener;

  FullscreenVideoPlayer(@NonNull ThemedReactContext context, VideoView videoView) {
    super(context, android.R.style.Theme_Black_NoTitleBar_Fullscreen);

    setCancelable(false);

    mVideoView = videoView;

    mContainerView = new FrameLayout(context);
    setContentView(mContainerView, generateDefaultLayoutParams());
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
  }

  void setUpdateListener(FullscreenVideoPlayerPresentationChangeListener listener) {
    mUpdateListener = new WeakReference<>(listener);
  }

  @Override
  protected void onStop() {
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
