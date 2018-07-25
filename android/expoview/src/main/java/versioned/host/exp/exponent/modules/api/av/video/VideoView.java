package versioned.host.exp.exponent.modules.api.av.video;

import android.annotation.SuppressLint;
import android.support.annotation.NonNull;
import android.util.Pair;
import android.view.MotionEvent;
import android.view.Surface;
import android.widget.FrameLayout;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.yqritc.scalablevideoview.ScalableType;

import versioned.host.exp.exponent.modules.api.av.AVModule;
import versioned.host.exp.exponent.modules.api.av.AudioEventHandler;
import versioned.host.exp.exponent.modules.api.av.player.PlayerData;
import versioned.host.exp.exponent.modules.api.av.player.PlayerDataControl;

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
    public void onStatusUpdate(final WritableMap status) {
      post(mMediaControllerUpdater);
      mEventEmitter.receiveEvent(getReactId(), VideoViewManager.Events.EVENT_STATUS_UPDATE.toString(), status);
    }
  };

  private RCTEventEmitter mEventEmitter;
  private final AVModule mAVModule;
  private VideoViewWrapper mVideoViewWrapper;

  private PlayerData mPlayerData = null;

  private ScalableType mResizeMode = ScalableType.LEFT_TOP;
  private boolean mUseNativeControls = false;
  private Boolean mOverridingUseNativeControls = null;
  private MediaController mMediaController = null;
  private Pair<Integer, Integer> mVideoWidthHeight = null;
  private FullscreenVideoPlayerPresentationChangeProgressListener mFullscreenPlayerPresentationChangeProgressListener = null;

  private WritableMap mStatusToSet = Arguments.createMap();

  private FullscreenVideoPlayer mFullscreenPlayer = null;
  private VideoTextureView mVideoTextureView = null;

  // Fullscreen change requests before the video loads
  private boolean mIsLoaded = false;
  private boolean mShouldShowFullscreenPlayerOnLoad = false;
  private FullscreenVideoPlayerPresentationChangeProgressListener mFullscreenVideoPlayerPresentationOnLoadChangeListener = null;

  public VideoView(@NonNull ThemedReactContext context, VideoViewWrapper videoViewWrapper) {
    super(context);

    mVideoViewWrapper = videoViewWrapper;

    mEventEmitter = context.getJSModule(RCTEventEmitter.class);
    mAVModule = context.getNativeModule(AVModule.class);
    mAVModule.registerVideoViewForAudioLifecycle(this);

    mVideoTextureView = new VideoTextureView(context, this);
    addView(mVideoTextureView, generateDefaultLayoutParams());

    mFullscreenPlayer = new FullscreenVideoPlayer(context, this);
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
    final WritableMap map = Arguments.createMap();
    map.putString("error", error);
    mEventEmitter.receiveEvent(getReactId(), VideoViewManager.Events.EVENT_ERROR.toString(), map);
  }

  private void callOnReadyForDisplay(final Pair<Integer, Integer> videoWidthHeight) {
    if (videoWidthHeight != null && mIsLoaded) {
      final int width = videoWidthHeight.first;
      final int height = videoWidthHeight.second;

      if (width == 0 || height == 0) {
        return;
      }

      final WritableMap naturalSize = Arguments.createMap();
      naturalSize.putInt("width", width);
      naturalSize.putInt("height", height);
      naturalSize.putString("orientation", width > height ? "landscape" : "portrait");

      final WritableMap map = Arguments.createMap();
      map.putMap("naturalSize", naturalSize);
      map.putMap("status", mPlayerData.getStatus());
      mEventEmitter.receiveEvent(getReactId(), VideoViewManager.Events.EVENT_READY_FOR_DISPLAY.toString(), map);
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
    callFullscreenCallbackWithUpdate(VideoViewManager.FullscreenPlayerUpdate.FULLSCREEN_PLAYER_WILL_PRESENT);

    if (mFullscreenPlayerPresentationChangeProgressListener != null) {
      mFullscreenPlayerPresentationChangeProgressListener.onFullscreenPlayerWillPresent();
    }
  }

  @Override
  public void onFullscreenPlayerDidPresent() {
    mMediaController.updateControls();
    callFullscreenCallbackWithUpdate(VideoViewManager.FullscreenPlayerUpdate.FULLSCREEN_PLAYER_DID_PRESENT);

    if (mFullscreenPlayerPresentationChangeProgressListener != null) {
      mFullscreenPlayerPresentationChangeProgressListener.onFullscreenPlayerDidPresent();
      mFullscreenPlayerPresentationChangeProgressListener = null;
    }
  }

  @Override
  public void onFullscreenPlayerWillDismiss() {
    callFullscreenCallbackWithUpdate(VideoViewManager.FullscreenPlayerUpdate.FULLSCREEN_PLAYER_WILL_DISMISS);

    if (mFullscreenPlayerPresentationChangeProgressListener != null) {
      mFullscreenPlayerPresentationChangeProgressListener.onFullscreenPlayerWillDismiss();
    }
  }

  @Override
  public void onFullscreenPlayerDidDismiss() {
    mMediaController.updateControls();
    callFullscreenCallbackWithUpdate(VideoViewManager.FullscreenPlayerUpdate.FULLSCREEN_PLAYER_DID_DISMISS);

    if (mFullscreenPlayerPresentationChangeProgressListener != null) {
      mFullscreenPlayerPresentationChangeProgressListener.onFullscreenPlayerDidDismiss();
      mFullscreenPlayerPresentationChangeProgressListener = null;
    }
  }

  private void callFullscreenCallbackWithUpdate(VideoViewManager.FullscreenPlayerUpdate update) {
    WritableMap event = Arguments.createMap();
    event.putInt("fullscreenUpdate", update.getValue());
    event.putMap("status", getStatus());
    mEventEmitter.receiveEvent(getReactId(), VideoViewManager.Events.EVENT_FULLSCREEN_PLAYER_UPDATE.toString(), event);
  }

  // Prop setting

  public void setStatus(final ReadableMap status, final Promise promise) {
    mStatusToSet.merge(status);
    if (mPlayerData != null) {
      final WritableMap statusToSet = Arguments.createMap();
      statusToSet.merge(mStatusToSet);
      mStatusToSet = Arguments.createMap();
      mPlayerData.setStatus(status, promise);
    } else if (promise != null) {
      promise.resolve(PlayerData.getUnloadedStatus());
    }
  }

  public WritableMap getStatus() {
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

  public void setSource(final ReadableMap source, final ReadableMap initialStatus, final Promise promise) {
    if (mPlayerData != null) {
      mStatusToSet.merge(mPlayerData.getStatus());
      mPlayerData.release();
      mPlayerData = null;
      mIsLoaded = false;
    }

    if (initialStatus != null) {
      mStatusToSet.merge(initialStatus);
    }

    final String uriString = source != null ? source.getString(PlayerData.STATUS_URI_KEY_PATH) : null;

    if (uriString == null) {
      if (promise != null) {
        promise.resolve(PlayerData.getUnloadedStatus());
      }
      return;
    }

    mEventEmitter.receiveEvent(getReactId(), VideoViewManager.Events.EVENT_LOAD_START.toString(), Arguments.createMap());

    final WritableMap statusToInitiallySet = Arguments.createMap();
    statusToInitiallySet.merge(mStatusToSet);
    mStatusToSet = Arguments.createMap();

    mPlayerData = PlayerData.createUnloadedPlayerData(mAVModule, (ThemedReactContext) getContext(), source, statusToInitiallySet);

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
      public void onLoadSuccess(final WritableMap status) {
        mIsLoaded = true;
        mVideoTextureView.scaleVideoSize(mPlayerData.getVideoWidthHeight(), mResizeMode);

        if (mVideoTextureView.isAttachedToWindow()) {
          mPlayerData.tryUpdateVideoSurface(mVideoTextureView.getSurface());
        }

        if (promise != null) {
          final WritableMap statusCopy = Arguments.createMap();
          statusCopy.merge(status);
          promise.resolve(statusCopy);
        }

        mPlayerData.setStatusUpdateListener(mStatusUpdateListener);
        mMediaController.setMediaPlayer(new PlayerDataControl(mPlayerData));
        mMediaController.setAnchorView(VideoView.this);
        maybeUpdateMediaControllerForUseNativeControls(false);
        mEventEmitter.receiveEvent(getReactId(), VideoViewManager.Events.EVENT_LOAD.toString(), status);
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
    mResizeMode = resizeMode;
    if (mPlayerData != null) {
      mVideoTextureView.scaleVideoSize(mPlayerData.getVideoWidthHeight(), mResizeMode);
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
