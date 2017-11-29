package versioned.host.exp.exponent.modules.api.av.video;

import android.annotation.SuppressLint;
import android.graphics.Matrix;
import android.graphics.SurfaceTexture;
import android.net.Uri;
import android.util.Pair;
import android.view.MotionEvent;
import android.view.Surface;
import android.view.TextureView;
import android.view.ViewTreeObserver;
import android.widget.MediaController;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.yqritc.scalablevideoview.ScalableType;
import com.yqritc.scalablevideoview.ScaleManager;
import com.yqritc.scalablevideoview.Size;

import versioned.host.exp.exponent.modules.api.av.AVModule;
import versioned.host.exp.exponent.modules.api.av.AudioEventHandler;
import versioned.host.exp.exponent.modules.api.av.player.PlayerData;
import versioned.host.exp.exponent.modules.api.av.player.PlayerDataControl;
import versioned.host.exp.exponent.modules.api.av.video.VideoViewManager.Events;

@SuppressLint("ViewConstructor")
public class VideoView extends TextureView implements
    TextureView.SurfaceTextureListener,
    AudioEventHandler {

  private final PlayerData.StatusUpdateListener mStatusUpdateListener = new PlayerData.StatusUpdateListener() {
    @Override
    public void onStatusUpdate(final WritableMap status) {
      mEventEmitter.receiveEvent(getId(), Events.EVENT_STATUS_UPDATE.toString(), status);
    }
  };

  private boolean mScrollChangedListenerIsSetup = false;
  private final ViewTreeObserver.OnScrollChangedListener mScrollChangedListener = new ViewTreeObserver.OnScrollChangedListener() {
    @Override
    public void onScrollChanged() {
      if (mMediaController != null) {
        mMediaController.hide();
      }
    }
  };

  private boolean mIsAttachedToWindow = false;

  private RCTEventEmitter mEventEmitter;
  private final AVModule mAVModule;

  private PlayerData mPlayerData = null;

  private ScalableType mResizeMode = ScalableType.LEFT_TOP;
  private boolean mUseNativeControls = false;
  private MediaController mMediaController = null;

  private WritableMap mStatusToSet = Arguments.createMap();

  private Surface mSurface = null;

  public VideoView(final ThemedReactContext themedReactContext) {
    super(themedReactContext, null, 0);

    mEventEmitter = themedReactContext.getJSModule(RCTEventEmitter.class);
    mAVModule = themedReactContext.getNativeModule(AVModule.class);
    mAVModule.registerVideoViewForAudioLifecycle(this);

    setSurfaceTextureListener(this);
  }

  private void unloadPlayerAndMediaController() {
    if (mMediaController != null) {
      ensureScrollChangeListenerIsRemoved();
      mMediaController.hide();
      mMediaController.setEnabled(false);
      mMediaController.setAnchorView(null);
      mMediaController = null;
    }
    if (mPlayerData != null) {
      mPlayerData.release();
      mPlayerData = null;
    }
  }

  void onDropViewInstance() {
    mAVModule.unregisterVideoViewForAudioLifecycle(this);
    unloadPlayerAndMediaController();
  }

  private void callOnError(final String error) {
    final WritableMap map = Arguments.createMap();
    map.putString("error", error);
    mEventEmitter.receiveEvent(getId(), Events.EVENT_ERROR.toString(), map);
  }

  private void callOnReadyForDisplay(final Pair<Integer, Integer> videoWidthHeight) {
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
    mEventEmitter.receiveEvent(getId(), Events.EVENT_READY_FOR_DISPLAY.toString(), map);
  }

  private void scaleVideoSize(final Pair<Integer, Integer> videoWidthHeight) {
    final int videoWidth = videoWidthHeight.first;
    final int videoHeight = videoWidthHeight.second;

    if (videoWidth == 0 || videoHeight == 0) {
      return;
    }

    final Size viewSize = new Size(getWidth(), getHeight());
    final Size videoSize = new Size(videoWidth, videoHeight);
    final Matrix matrix = new ScaleManager(viewSize, videoSize).getScaleMatrix(mResizeMode);
    if (matrix != null) {
      setTransform(matrix);
    }
  }

  private void ensureScrollChangeListenerIsSetup() {
    if (!mScrollChangedListenerIsSetup) {
      getViewTreeObserver().addOnScrollChangedListener(mScrollChangedListener);
      mScrollChangedListenerIsSetup = true;
    }
  }

  private void ensureScrollChangeListenerIsRemoved() {
    if (mScrollChangedListenerIsSetup) {
      getViewTreeObserver().removeOnScrollChangedListener(mScrollChangedListener);
      mScrollChangedListenerIsSetup = false;
    }
  }

  private void updateMediaControllerForUseNativeControls() {
    if (mMediaController != null) {
      mMediaController.setEnabled(mUseNativeControls);
      ensureScrollChangeListenerIsSetup();
      if (mUseNativeControls) {
        mMediaController.show();
      } else {
        mMediaController.hide();
      }
    }
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

  void setUseNativeControls(final boolean useNativeControls) {
    mUseNativeControls = useNativeControls;

    if (mPlayerData != null) {
      updateMediaControllerForUseNativeControls();
    }
  }

  public void setUri(final Uri uri, final ReadableMap initialStatus, final Promise promise) {
    if (mPlayerData != null) {
      mStatusToSet.merge(mPlayerData.getStatus());
      mPlayerData.release();
      mPlayerData = null;
    }

    if (initialStatus != null) {
      mStatusToSet.merge(initialStatus);
    }

    if (uri == null) {
      if (promise != null) {
        promise.resolve(PlayerData.getUnloadedStatus());
      }
      return;
    }

    mEventEmitter.receiveEvent(getId(), Events.EVENT_LOAD_START.toString(), Arguments.createMap());

    final WritableMap statusToInitiallySet = Arguments.createMap();
    statusToInitiallySet.merge(mStatusToSet);
    mStatusToSet = Arguments.createMap();

    mPlayerData = PlayerData.createUnloadedPlayerData(mAVModule, uri, statusToInitiallySet);

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
        scaleVideoSize(videoWidthHeight);
        callOnReadyForDisplay(videoWidthHeight);
      }
    });

    mPlayerData.load(statusToInitiallySet, new PlayerData.LoadCompletionListener() {
      @Override
      public void onLoadSuccess(final WritableMap status) {
        scaleVideoSize(mPlayerData.getVideoWidthHeight());

        if (mIsAttachedToWindow) {
          mPlayerData.tryUpdateVideoSurface(mSurface);
        }

        if (promise != null) {
          final WritableMap statusCopy = Arguments.createMap();
          statusCopy.merge(status);
          promise.resolve(statusCopy);
        }

        mPlayerData.setStatusUpdateListener(mStatusUpdateListener);

        mMediaController = new MediaController(VideoView.this.getContext());
        mMediaController.setMediaPlayer(new PlayerDataControl(mPlayerData));
        mMediaController.setAnchorView(VideoView.this);
        updateMediaControllerForUseNativeControls();

        mEventEmitter.receiveEvent(getId(), Events.EVENT_LOAD.toString(), status);
      }

      @Override
      public void onLoadError(final String error) {
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
      scaleVideoSize(mPlayerData.getVideoWidthHeight());
    }
  }

  // View

  @Override
  public boolean onTouchEvent(final MotionEvent event) {
    if (mUseNativeControls && mMediaController != null) {
      mMediaController.show();
    }
    return super.onTouchEvent(event);
  }

  @Override
  @SuppressLint("DrawAllocation")
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    super.onLayout(changed, left, top, right, bottom);

    if (changed && mPlayerData != null) {
      scaleVideoSize(mPlayerData.getVideoWidthHeight());
    }
  }

  // TextureView

  @Override
  public void onSurfaceTextureAvailable(final SurfaceTexture surfaceTexture, final int width, final int height) {
    mSurface = new Surface(surfaceTexture);
    if (mPlayerData != null) {
      mPlayerData.tryUpdateVideoSurface(mSurface);
    }
  }

  @Override
  public void onSurfaceTextureSizeChanged(final SurfaceTexture surfaceTexture, final int width, final int height) {
    // no-op
  }

  @Override
  public boolean onSurfaceTextureDestroyed(final SurfaceTexture surfaceTexture) {
    mSurface = null;
    if (mPlayerData != null) {
      mPlayerData.tryUpdateVideoSurface(null);
    }
    return true;
  }

  @Override
  public void onSurfaceTextureUpdated(final SurfaceTexture surfaceTexture) {
    // no-op
  }

  @Override
  protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();
    mIsAttachedToWindow = false;
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    mIsAttachedToWindow = true;
    if (mPlayerData != null) {
      mPlayerData.tryUpdateVideoSurface(mSurface);
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
      mPlayerData.onPause();
    }
  }

  @Override
  public void onResume() {
    if (mPlayerData != null) {
      mPlayerData.onResume();
    }
  }
}
