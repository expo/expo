package expo.modules.av.video;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Bundle;
import android.util.Pair;
import android.view.MotionEvent;
import android.view.Surface;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import expo.modules.av.AVManagerInterface;
import expo.modules.av.AudioEventHandler;
import expo.modules.av.player.PlayerData;
import expo.modules.av.player.PlayerDataControl;
import expo.modules.av.video.scalablevideoview.ScalableType;
import expo.modules.core.Promise;
import expo.modules.core.arguments.ReadableArguments;
import expo.modules.kotlin.AppContext;
import kotlin.Unit;

@SuppressLint("ViewConstructor")
public class VideoView extends FrameLayout implements AudioEventHandler, FullscreenVideoPlayerPresentationChangeListener, PlayerData.FullscreenPresenter {

  private final Runnable mMediaControllerUpdater = new Runnable() {
    @Override
    public void run() {
      if (mMediaController != null) {
        mMediaController.updateControls();
      }
    }
  };

  private final PlayerData.StatusUpdateListener mStatusUpdateListener = new PlayerData.StatusUpdateListener() {
    @Override
    public void onStatusUpdate(final Bundle status) {
      post(mMediaControllerUpdater);
      mVideoViewWrapper.getOnStatusUpdate().invoke(status);
    }
  };

  private final AVManagerInterface mAVModule;
  private VideoViewWrapper mVideoViewWrapper;

  private PlayerData mPlayerData = null;

  private ReadableArguments mLastSource;
  private ScalableType mResizeMode = ScalableType.LEFT_TOP;
  private boolean mUseNativeControls = false;
  private Boolean mOverridingUseNativeControls = null;
  private MediaController mMediaController = null;
  private Pair<Integer, Integer> mVideoWidthHeight = null;
  private FullscreenVideoPlayerPresentationChangeProgressListener mFullscreenPlayerPresentationChangeProgressListener = null;

  private Bundle mStatusToSet = new Bundle();

  private FullscreenVideoPlayer mFullscreenPlayer = null;
  private VideoTextureView mVideoTextureView = null;

  // Fullscreen change requests before the video loads
  private boolean mIsLoaded = false;
  private boolean mShouldShowFullscreenPlayerOnLoad = false;
  private FullscreenVideoPlayerPresentationChangeProgressListener mFullscreenVideoPlayerPresentationOnLoadChangeListener = null;

  public VideoView(@NonNull Context context, VideoViewWrapper videoViewWrapper, AppContext appContext) {
    super(context);

    mVideoViewWrapper = videoViewWrapper;

    mAVModule = appContext.getLegacyModuleRegistry().getModule(AVManagerInterface.class);
    mAVModule.registerVideoViewForAudioLifecycle(this);

    mVideoTextureView = new VideoTextureView(context, this);
    addView(mVideoTextureView, generateDefaultLayoutParams());

    mFullscreenPlayer = new FullscreenVideoPlayer(context, this, appContext);
    mFullscreenPlayer.setUpdateListener(this);

    mMediaController = new MediaController(VideoView.this.getContext());
    mMediaController.setAnchorView(this);
    maybeUpdateMediaControllerForUseNativeControls();
  }

  public void unloadPlayerAndMediaController() {
    ensureFullscreenPlayerIsDismissed();
    if (mMediaController != null) {
      mMediaController.hide();
      mMediaController.setEnabled(false);
      mMediaController.setAnchorView(null);
      mMediaController = null;
    }
    if (mPlayerData != null) {
      mPlayerData.release();
      mPlayerData = null;
    }
    mIsLoaded = false;
  }

  void onDropViewInstance() {
    mAVModule.unregisterVideoViewForAudioLifecycle(this);
    unloadPlayerAndMediaController();
  }

  private void callOnError(final String error) {
    final Bundle map = new Bundle();
    map.putString("error", error);
    mVideoViewWrapper.getOnError().invoke(map);
  }

  private void callOnReadyForDisplay(final Pair<Integer, Integer> videoWidthHeight) {
    if (videoWidthHeight != null && mIsLoaded) {
      final int width = videoWidthHeight.first;
      final int height = videoWidthHeight.second;

      if (width == 0 || height == 0) {
        return;
      }

      final Bundle naturalSize = new Bundle();
      naturalSize.putInt("width", width);
      naturalSize.putInt("height", height);
      naturalSize.putString("orientation", width > height ? "landscape" : "portrait");

      final Bundle map = new Bundle();
      map.putBundle("naturalSize", naturalSize);
      map.putBundle("status", mPlayerData.getStatus());
      mVideoViewWrapper.getOnReadyForDisplay().invoke(map);
    }
  }

  public void maybeUpdateMediaControllerForUseNativeControls() {
    maybeUpdateMediaControllerForUseNativeControls(true);
  }

  public void maybeUpdateMediaControllerForUseNativeControls(boolean showMediaControllerIfEnabled) {
    if (mPlayerData != null && mMediaController != null) {
      mMediaController.updateControls();
      mMediaController.setEnabled(shouldUseNativeControls());
      if (shouldUseNativeControls() && showMediaControllerIfEnabled) {
        mMediaController.show();
      } else {
        mMediaController.hide();
      }
    }
  }

  // Imperative API

  public void ensureFullscreenPlayerIsPresented() {
    ensureFullscreenPlayerIsPresented(null);
  }

  public void ensureFullscreenPlayerIsPresented(FullscreenVideoPlayerPresentationChangeProgressListener listener) {
    if (!mIsLoaded) {
      saveFullscreenPlayerStateForOnLoad(true, listener);
      return;
    }

    if (mFullscreenPlayerPresentationChangeProgressListener != null) {
      if (listener != null) {
        listener.onFullscreenPlayerPresentationTriedToInterrupt();
      }
      return;
    }

    if (!isBeingPresentedFullscreen()) {
      if (listener != null) {
        mFullscreenPlayerPresentationChangeProgressListener = listener;
      }

      mFullscreenPlayer.show();
    } else {
      if (listener != null) {
        listener.onFullscreenPlayerDidPresent();
      }
    }
  }

  public void ensureFullscreenPlayerIsDismissed() {
    ensureFullscreenPlayerIsDismissed(null);
  }

  public void ensureFullscreenPlayerIsDismissed(FullscreenVideoPlayerPresentationChangeProgressListener listener) {
    if (!mIsLoaded) {
      saveFullscreenPlayerStateForOnLoad(false, listener);
      return;
    }

    if (mFullscreenPlayerPresentationChangeProgressListener != null) {
      if (listener != null) {
        listener.onFullscreenPlayerPresentationTriedToInterrupt();
      }
      return;
    }

    if (isBeingPresentedFullscreen()) {
      if (listener != null) {
        mFullscreenPlayerPresentationChangeProgressListener = listener;
      }

      mFullscreenPlayer.dismiss();
    } else {
      if (listener != null) {
        listener.onFullscreenPlayerDidDismiss();
      }
    }
  }

  private void saveFullscreenPlayerStateForOnLoad(boolean requestedIsPresentedFullscreen, FullscreenVideoPlayerPresentationChangeProgressListener listener) {
    mShouldShowFullscreenPlayerOnLoad = requestedIsPresentedFullscreen;
    if (mFullscreenVideoPlayerPresentationOnLoadChangeListener != null) {
      mFullscreenVideoPlayerPresentationOnLoadChangeListener.onFullscreenPlayerPresentationInterrupted();
    }
    mFullscreenVideoPlayerPresentationOnLoadChangeListener = listener;
  }

  @Override
  public void onFullscreenPlayerWillPresent() {
    callFullscreenCallbackWithUpdate(FullscreenPlayerUpdate.FULLSCREEN_PLAYER_WILL_PRESENT);

    if (mFullscreenPlayerPresentationChangeProgressListener != null) {
      mFullscreenPlayerPresentationChangeProgressListener.onFullscreenPlayerWillPresent();
    }
  }

  @Override
  public void onFullscreenPlayerDidPresent() {
    if (mMediaController != null) {
      mMediaController.updateControls();
    }
    callFullscreenCallbackWithUpdate(FullscreenPlayerUpdate.FULLSCREEN_PLAYER_DID_PRESENT);

    if (mFullscreenPlayerPresentationChangeProgressListener != null) {
      mFullscreenPlayerPresentationChangeProgressListener.onFullscreenPlayerDidPresent();
      mFullscreenPlayerPresentationChangeProgressListener = null;
    }
  }

  @Override
  public void onFullscreenPlayerWillDismiss() {
    callFullscreenCallbackWithUpdate(FullscreenPlayerUpdate.FULLSCREEN_PLAYER_WILL_DISMISS);

    if (mFullscreenPlayerPresentationChangeProgressListener != null) {
      mFullscreenPlayerPresentationChangeProgressListener.onFullscreenPlayerWillDismiss();
    }
  }

  @Override
  public void onFullscreenPlayerDidDismiss() {
    if (mMediaController != null) {
      mMediaController.updateControls();
    }
    callFullscreenCallbackWithUpdate(FullscreenPlayerUpdate.FULLSCREEN_PLAYER_DID_DISMISS);

    if (mFullscreenPlayerPresentationChangeProgressListener != null) {
      mFullscreenPlayerPresentationChangeProgressListener.onFullscreenPlayerDidDismiss();
      mFullscreenPlayerPresentationChangeProgressListener = null;
    }
  }

  private void callFullscreenCallbackWithUpdate(FullscreenPlayerUpdate update) {
    Bundle event = new Bundle();
    event.putInt("fullscreenUpdate", update.getJsValue());
    event.putBundle("status", getStatus());
    mVideoViewWrapper.getOnFullscreenUpdate().invoke(event);
  }

  // Prop setting

  public void setStatus(final ReadableArguments status, final Promise promise) {
    Bundle statusBundle = status.toBundle();
    mStatusToSet.putAll(statusBundle);
    if (mPlayerData != null) {
      final Bundle statusToSet = new Bundle();
      statusToSet.putAll(mStatusToSet);
      mStatusToSet = new Bundle();
      mPlayerData.setStatus(statusBundle, promise);
    } else if (promise != null) {
      promise.resolve(PlayerData.getUnloadedStatus());
    }
  }

  public Bundle getStatus() {
    return mPlayerData == null ? PlayerData.getUnloadedStatus() : mPlayerData.getStatus();
  }

  private boolean shouldUseNativeControls() {
    if (mOverridingUseNativeControls != null) {
      return mOverridingUseNativeControls;
    }

    return mUseNativeControls;
  }

  void setOverridingUseNativeControls(final Boolean useNativeControls) {
    mOverridingUseNativeControls = useNativeControls;
    maybeUpdateMediaControllerForUseNativeControls();
  }

  void setUseNativeControls(final boolean useNativeControls) {
    mUseNativeControls = useNativeControls;
    maybeUpdateMediaControllerForUseNativeControls();
  }

  private static boolean equalBundles(Bundle one, Bundle two) {
    if((one.size() != two.size()) || !one.keySet().containsAll(two.keySet())) {
      return false;
    }

    for (String key : one.keySet()) {
      Object valueOne = one.get(key);
      Object valueTwo = two.get(key);
      if (valueOne instanceof Bundle && valueTwo instanceof Bundle) {
        if (!equalBundles((Bundle) valueOne, (Bundle) valueTwo)) {
          return false;
        }
      } else if (valueOne == null) {
        if (valueTwo != null) {
          return false;
        }
      } else if (!valueOne.equals(valueTwo)) {
        return false;
      }
    }

    return true;
  }

  public void setSource(final ReadableArguments source) {
    if (mLastSource == null || !equalBundles(mLastSource.toBundle(), source.toBundle())) {
      mLastSource = source;
      setSource(source, null, null);
    }
  }

  public void setSource(final ReadableArguments source, final ReadableArguments initialStatus, final Promise promise) {
    if (mPlayerData != null) {
      mStatusToSet.putAll(mPlayerData.getStatus());
      mPlayerData.release();
      mPlayerData = null;
      mIsLoaded = false;
    }

    if (initialStatus != null) {
      mStatusToSet.putAll(initialStatus.toBundle());
    }

    final String uriString = source != null ? source.getString(PlayerData.STATUS_URI_KEY_PATH) : null;

    if (uriString == null) {
      if (promise != null) {
        promise.resolve(PlayerData.getUnloadedStatus());
      }
      return;
    }

    mVideoViewWrapper.getOnLoadStart().invoke(Unit.INSTANCE);

    final Bundle statusToInitiallySet = new Bundle();
    statusToInitiallySet.putAll(mStatusToSet);
    mStatusToSet = new Bundle();

    mPlayerData = PlayerData.createUnloadedPlayerData(mAVModule, getContext(), source, statusToInitiallySet);

    mPlayerData.setErrorListener(new PlayerData.ErrorListener() {
      @Override
      public void onError(final String error) {
        unloadPlayerAndMediaController();
        callOnError(error);
      }
    });
    mPlayerData.setVideoSizeUpdateListener(new PlayerData.VideoSizeUpdateListener() {
      @Override
      public void onVideoSizeUpdate(final Pair<Integer, Integer> videoWidthHeight) {
        mVideoTextureView.scaleVideoSize(videoWidthHeight, mResizeMode);
        mVideoWidthHeight = videoWidthHeight;
        callOnReadyForDisplay(videoWidthHeight);
      }
    });

    mPlayerData.setFullscreenPresenter(this);

    mPlayerData.load(statusToInitiallySet, new PlayerData.LoadCompletionListener() {
      @Override
      public void onLoadSuccess(final Bundle status) {
        mIsLoaded = true;
        mVideoTextureView.scaleVideoSize(mPlayerData.getVideoWidthHeight(), mResizeMode);

        if (mVideoTextureView.isAttachedToWindow()) {
          mPlayerData.tryUpdateVideoSurface(mVideoTextureView.getSurface());
        }

        if (promise != null) {
          final Bundle statusCopy = new Bundle();
          statusCopy.putAll(status);
          promise.resolve(statusCopy);
        }

        mPlayerData.setStatusUpdateListener(mStatusUpdateListener);

        if (mMediaController == null) {
          mMediaController = new MediaController(VideoView.this.getContext());
        }
        mMediaController.setMediaPlayer(new PlayerDataControl(mPlayerData));
        mMediaController.setAnchorView(VideoView.this);
        maybeUpdateMediaControllerForUseNativeControls(false);
        mVideoViewWrapper.getOnLoad().invoke(status);
        // Execute the fullscreen player state change requested before the video loaded
        if (mFullscreenVideoPlayerPresentationOnLoadChangeListener != null) {
          FullscreenVideoPlayerPresentationChangeProgressListener listener = mFullscreenVideoPlayerPresentationOnLoadChangeListener;
          mFullscreenVideoPlayerPresentationOnLoadChangeListener = null;
          if (mShouldShowFullscreenPlayerOnLoad) {
            ensureFullscreenPlayerIsPresented(listener);
          } else {
            ensureFullscreenPlayerIsDismissed(listener);
          }
        }
        callOnReadyForDisplay(mVideoWidthHeight);
      }

      @Override
      public void onLoadError(final String error) {
        if (mFullscreenVideoPlayerPresentationOnLoadChangeListener != null) {
          mFullscreenVideoPlayerPresentationOnLoadChangeListener.onFullscreenPlayerPresentationError(error);
          mFullscreenVideoPlayerPresentationOnLoadChangeListener = null;
        }
        mShouldShowFullscreenPlayerOnLoad = false;

        unloadPlayerAndMediaController();
        if (promise != null) {
          promise.reject("E_VIDEO_NOTCREATED", error);
        }
        callOnError(error);
      }
    });
  }

  void setResizeMode(final ScalableType resizeMode) {
    if (mResizeMode != resizeMode) {
      mResizeMode = resizeMode;
      if (mPlayerData != null) {
        mVideoTextureView.scaleVideoSize(mPlayerData.getVideoWidthHeight(), mResizeMode);
      }
    }
  }

  // View

  private int getReactId() {
    return mVideoViewWrapper.getId();
  }

  @SuppressLint("ClickableViewAccessibility")
  @Override
  public boolean onTouchEvent(final MotionEvent event) {
    if (shouldUseNativeControls() && mMediaController != null) {
      mMediaController.show();
    }
    return super.onTouchEvent(event);
  }

  @Override
  @SuppressLint("DrawAllocation")
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    super.onLayout(changed, left, top, right, bottom);

    if (changed && mPlayerData != null) {
      mVideoTextureView.scaleVideoSize(mPlayerData.getVideoWidthHeight(), mResizeMode);
    }
  }

  // TextureView

  public void tryUpdateVideoSurface(Surface surface) {
    if (mPlayerData != null) {
      mPlayerData.tryUpdateVideoSurface(surface);
    }
  }

  // AudioEventHandler

  @Override
  public void pauseImmediately() {
    if (mPlayerData != null) {
      mPlayerData.pauseImmediately();
    }
  }

  @Override
  public boolean requiresAudioFocus() {
    return mPlayerData != null && mPlayerData.requiresAudioFocus();
  }

  @Override
  public void updateVolumeMuteAndDuck() {
    if (mPlayerData != null) {
      mPlayerData.updateVolumeMuteAndDuck();
    }
  }

  @Override
  public void handleAudioFocusInterruptionBegan() {
    if (mPlayerData != null) {
      mPlayerData.handleAudioFocusInterruptionBegan();
    }
  }

  @Override
  public void handleAudioFocusGained() {
    if (mPlayerData != null) {
      mPlayerData.handleAudioFocusGained();
    }
  }

  @Override
  public void onPause() {
    if (mPlayerData != null) {
      ensureFullscreenPlayerIsDismissed();
      mPlayerData.onPause();
    }
  }

  @Override
  public void onResume() {
    if (mPlayerData != null) {
      mPlayerData.onResume();
    }
    mVideoTextureView.onResume();
  }

  // FullscreenPresenter

  @Override
  public boolean isBeingPresentedFullscreen() {
    return mFullscreenPlayer.isShowing();
  }

  @Override
  public void setFullscreenMode(boolean isFullscreen) {
    if (isFullscreen) {
      ensureFullscreenPlayerIsPresented();
    } else {
      ensureFullscreenPlayerIsDismissed();
    }
  }
}
