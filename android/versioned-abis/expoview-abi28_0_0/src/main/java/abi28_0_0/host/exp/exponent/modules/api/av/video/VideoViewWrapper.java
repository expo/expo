package abi28_0_0.host.exp.exponent.modules.api.av.video;

import android.annotation.SuppressLint;
import android.support.annotation.NonNull;
import android.widget.FrameLayout;

import abi28_0_0.com.facebook.react.uimanager.ThemedReactContext;

/**
 * We need the wrapper to be able to remove the view from the React-managed tree
 * into the FullscreenVideoPlayer and not have to fight with the React styles
 * overriding our native layout.
 */

@SuppressLint("ViewConstructor")
public class VideoViewWrapper extends FrameLayout {
  private VideoView mVideoView = null;

  public VideoViewWrapper(@NonNull ThemedReactContext context) {
    super(context);
    mVideoView = new VideoView(context, this);
    addView(mVideoView, generateDefaultLayoutParams());
  }

  public VideoView getVideoViewInstance() {
    return mVideoView;
  }

  private final Runnable mLayoutRunnable = new Runnable() {
    @Override
    public void run() {
      measure(
          MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
          MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));
      layout(getLeft(), getTop(), getRight(), getBottom());
    }
  };

  @Override
  public void requestLayout() {
    super.requestLayout();

    // Code borrowed from:
    // https://github.com/facebook/react-native/blob/d19afc73f5048f81656d0b4424232ce6d69a6368/ReactAndroid/src/main/java/com/facebook/react/views/toolbar/ReactToolbar.java#L166

    // It fixes two bugs:
    // - ExpoMediaController's height = 0 when initialized (until relayout)
    // - blank VideoView (until relayout) after dismissing FullscreenVideoPlayer
    post(mLayoutRunnable);
  }
}
