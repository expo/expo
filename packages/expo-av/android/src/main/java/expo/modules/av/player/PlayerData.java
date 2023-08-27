package expo.modules.av.player;

import android.Manifest;
import android.content.Context;
import android.media.audiofx.Visualizer;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.util.Pair;
import android.view.Surface;

import androidx.annotation.UiThread;

import com.facebook.jni.HybridData;
import com.facebook.react.bridge.UiThreadUtil;

import expo.modules.core.Promise;
import expo.modules.core.arguments.ReadableArguments;

import java.lang.ref.WeakReference;
import java.util.Map;
import java.util.Objects;

import expo.modules.av.AVManagerInterface;
import expo.modules.av.AudioEventHandler;
import expo.modules.av.AudioFocusNotAcquiredException;
import expo.modules.av.progress.AndroidLooperTimeMachine;
import expo.modules.av.progress.ProgressLooper;
import expo.modules.core.interfaces.DoNotStrip;
import expo.modules.core.interfaces.services.UIManager;
import expo.modules.interfaces.permissions.PermissionsResponse;
import expo.modules.interfaces.permissions.PermissionsStatus;

public abstract class PlayerData implements AudioEventHandler {
  static final String STATUS_ANDROID_IMPLEMENTATION_KEY_PATH = "androidImplementation";
  static final String STATUS_HEADERS_KEY_PATH = "headers";
  static final String STATUS_IS_LOADED_KEY_PATH = "isLoaded";
  public static final String STATUS_URI_KEY_PATH = "uri";
  static final String STATUS_OVERRIDING_EXTENSION_KEY_PATH = "overridingExtension";
  static final String STATUS_PROGRESS_UPDATE_INTERVAL_MILLIS_KEY_PATH = "progressUpdateIntervalMillis";
  static final String STATUS_DURATION_MILLIS_KEY_PATH = "durationMillis";
  static final String STATUS_POSITION_MILLIS_KEY_PATH = "positionMillis";
  static final String STATUS_PLAYABLE_DURATION_MILLIS_KEY_PATH = "playableDurationMillis";
  static final String STATUS_SHOULD_PLAY_KEY_PATH = "shouldPlay";
  public static final String STATUS_IS_PLAYING_KEY_PATH = "isPlaying";
  static final String STATUS_IS_BUFFERING_KEY_PATH = "isBuffering";
  static final String STATUS_RATE_KEY_PATH = "rate";
  static final String STATUS_SHOULD_CORRECT_PITCH_KEY_PATH = "shouldCorrectPitch";
  static final String STATUS_VOLUME_KEY_PATH = "volume";
  static final String STATUS_VOLUME_PAN_KEY_PATH = "audioPan";
  static final String STATUS_IS_MUTED_KEY_PATH = "isMuted";
  static final String STATUS_IS_LOOPING_KEY_PATH = "isLooping";
  static final String STATUS_DID_JUST_FINISH_KEY_PATH = "didJustFinish";

  @DoNotStrip
  private final HybridData mHybridData;

  public static Bundle getUnloadedStatus() {
    final Bundle map = new Bundle();
    map.putBoolean(STATUS_IS_LOADED_KEY_PATH, false);
    return map;
  }

  public interface VideoSizeUpdateListener {
    void onVideoSizeUpdate(final Pair<Integer, Integer> videoWidthHeight);
  }

  public interface ErrorListener {
    void onError(final String error);
  }

  public interface LoadCompletionListener {
    void onLoadSuccess(final Bundle status);

    void onLoadError(final String error);
  }

  public interface StatusUpdateListener {
    void onStatusUpdate(final Bundle status);
  }

  interface SetStatusCompletionListener {
    void onSetStatusComplete();

    void onSetStatusError(final String error);
  }

  public interface FullscreenPresenter {
    boolean isBeingPresentedFullscreen();

    void setFullscreenMode(boolean isFullscreen);
  }

  final AVManagerInterface mAVModule;
  final Uri mUri;
  final Map<String, Object> mRequestHeaders;
  private final WeakReference<UIManager> mUiManager;

  private ProgressLooper mProgressUpdater = new ProgressLooper(new AndroidLooperTimeMachine());

  private Visualizer mVisualizer = null;

  private FullscreenPresenter mFullscreenPresenter = null;
  private StatusUpdateListener mStatusUpdateListener = null;
  ErrorListener mErrorListener = null;
  VideoSizeUpdateListener mVideoSizeUpdateListener = null;

  private int mProgressUpdateIntervalMillis = 500;
  boolean mShouldPlay = false;
  float mRate = 1.0f;
  boolean mShouldCorrectPitch = false;
  float mVolume = 1.0f;
  float mPan = 0.0f;
  boolean mIsMuted = false;

  PlayerData(final AVManagerInterface avModule, final Uri uri, final Map<String, Object> requestHeaders) {
    mRequestHeaders = requestHeaders;
    mAVModule = avModule;
    mUri = uri;
    mUiManager = new WeakReference<>(avModule.getModuleRegistry().getModule(UIManager.class));

    mHybridData = initHybrid();
  }

  @Override
  protected void finalize() throws Throwable {
    super.finalize();
    if (mVisualizer != null) {
      mVisualizer.release();
      mVisualizer = null;
    }
    mHybridData.resetNative();
  }

  @SuppressWarnings("JavaJniMissingFunction")
  private native HybridData initHybrid();
  @SuppressWarnings({"JavaJniMissingFunction"})
  protected native void sampleBufferCallback(byte[] sampleBuffer, double positionSeconds);

  protected double getCurrentPositionSeconds() {
    return 0;
  }

//  @SuppressWarnings("unused")
  @DoNotStrip
  void setEnableSampleBufferCallback(boolean enable) {
    if (!UiThreadUtil.isOnUiThread()) {
      UiThreadUtil.runOnUiThread(() -> {
        setEnableSampleBufferCallback(enable);
      });
      return;
    }

    if (enable) {
      try {
        boolean hasRecordAudioPermission = mAVModule.hasAudioPermission();
        if (!hasRecordAudioPermission) {
          mAVModule.requestAudioPermission(result -> {
            PermissionsResponse response = result.get(Manifest.permission.RECORD_AUDIO);
            if (response == null) {
              return;
            }
            if (response.getStatus() == PermissionsStatus.GRANTED) {
              // call func again, this time we have audio permission
              setEnableSampleBufferCallback(true);
            } else if (!response.getCanAskAgain()) {
              Log.e("PlayerData", "Cannot initialize Sample Data Callback (Visualizer) when RECORD_AUDIO permission is not granted!");
            }
          });
          return;
        }
        int id = getAudioSessionId();
        Log.i("PlayerData", "Initializing Visualizer for Audio Session #" + id + "...");
        mVisualizer = new Visualizer(id);
        mVisualizer.setEnabled(false);
        mVisualizer.setCaptureSize(Visualizer.getCaptureSizeRange()[1]);

        // the rate at which the Visualizer calls back with new bytes - will be clamped to max 100ms (1000 mHz)
        int callbackRate = Math.min(Visualizer.getMaxCaptureRate(), 10000);
        mVisualizer.setDataCaptureListener(new Visualizer.OnDataCaptureListener() {
          @Override
          public void onWaveFormDataCapture(Visualizer visualizer, byte[] bytes, int samplingRate) {
            if (mShouldPlay) {
              emitSampleBufferEvent(bytes, getCurrentPositionSeconds());
            }
          }

          @Override
          public void onFftDataCapture(Visualizer visualizer, byte[] bytes, int samplingRate) { }
        }, callbackRate, true, false);

        mVisualizer.setEnabled(true);

        Log.i("PlayerData", "Visualizer initialized with a capture rate of " + callbackRate);
      } catch (Throwable e) {
        Log.e("PlayerData", "Failed to initialize Visualizer! " + e.getLocalizedMessage());
        e.printStackTrace();
      }
    } else {
      if (mVisualizer != null) {
        mVisualizer.setEnabled(false);
        mVisualizer.release();
      }
      mVisualizer = null;
    }
  }

  public static PlayerData createUnloadedPlayerData(final AVManagerInterface avModule, final Context context, final ReadableArguments source, final Bundle status) {
    final String uriString = source.getString(STATUS_URI_KEY_PATH);
    Map requestHeaders = null;
    if (source.containsKey(STATUS_HEADERS_KEY_PATH)) {
      requestHeaders = source.getMap(STATUS_HEADERS_KEY_PATH);
    }
    final String uriOverridingExtension = source.containsKey(STATUS_OVERRIDING_EXTENSION_KEY_PATH) ? source.getString(STATUS_OVERRIDING_EXTENSION_KEY_PATH) : null;
    // uriString is guaranteed not to be null (both VideoView.setSource and Sound.loadAsync handle that case)
    final Uri uri = Uri.parse(uriString);

    if (status.containsKey(STATUS_ANDROID_IMPLEMENTATION_KEY_PATH)
      && Objects.equals(status.getString(STATUS_ANDROID_IMPLEMENTATION_KEY_PATH), MediaPlayerData.IMPLEMENTATION_NAME)) {
      return new MediaPlayerData(avModule, context, uri, requestHeaders);
    } else {
      return new SimpleExoPlayerData(avModule, context, uri, uriOverridingExtension, requestHeaders);
    }
  }

  @UiThread
  private void emitSampleBufferEvent(final byte[] bytes, final double currentPositionSeconds) {
    final UIManager uiManager = mUiManager.get();
    if (uiManager != null) {
      uiManager.runOnClientCodeQueueThread(() -> {
        sampleBufferCallback(bytes, currentPositionSeconds);
      });
    }
  }

  abstract String getImplementationName();

  // Lifecycle

  public abstract void load(final Bundle status, final LoadCompletionListener loadCompletionListener);

  public void release() {
    if (mVisualizer != null) {
      mVisualizer.setDataCaptureListener(null, 0, false, false);
      mVisualizer.setEnabled(false);
      mVisualizer.release();
      mVisualizer = null;
    }
  }

  // Status update listener

  private void callStatusUpdateListenerWithStatus(final Bundle status) {
    if (mStatusUpdateListener != null) {
      mStatusUpdateListener.onStatusUpdate(status);
    }
  }

  final void callStatusUpdateListenerWithDidJustFinish() {
    final Bundle status = getStatus();
    status.putBoolean(STATUS_DID_JUST_FINISH_KEY_PATH, true);
    callStatusUpdateListenerWithStatus(status);
  }

  final void callStatusUpdateListener() {
    callStatusUpdateListenerWithStatus(getStatus());
  }

  abstract boolean shouldContinueUpdatingProgress();

  final void stopUpdatingProgressIfNecessary() {
    mProgressUpdater.stopLooping();
  }

  final void beginUpdatingProgressIfNecessary() {
    if (shouldContinueUpdatingProgress() && !mProgressUpdater.isLooping() && (mStatusUpdateListener != null)) {
      mProgressUpdater.loop(mProgressUpdateIntervalMillis, () -> {
        this.callStatusUpdateListener();
        return null;
      });
    }
  }

  public final void setStatusUpdateListener(final StatusUpdateListener listener) {
    final StatusUpdateListener oldListener = mStatusUpdateListener;
    mStatusUpdateListener = listener;
    if (mStatusUpdateListener != null) {
      beginUpdatingProgressIfNecessary();

      // Notify app about the current status upon setting the status listener
      if (oldListener == null) {
        callStatusUpdateListener();
      }
    } else {
      stopUpdatingProgressIfNecessary();
    }
  }

  // Error listener

  public final void setErrorListener(final ErrorListener listener) {
    mErrorListener = listener;
  }

  // Status

  final boolean shouldPlayerPlay() {
    return mShouldPlay && mRate > 0.0;
  }

  abstract void playPlayerWithRateAndMuteIfNecessary() throws AudioFocusNotAcquiredException;

  abstract void applyNewStatus(final Integer newPositionMillis, final Boolean newIsLooping)
    throws AudioFocusNotAcquiredException, IllegalStateException;

  final void setStatusWithListener(final Bundle status, final SetStatusCompletionListener setStatusCompletionListener) {
    if (status.containsKey(STATUS_PROGRESS_UPDATE_INTERVAL_MILLIS_KEY_PATH)) {
      if (mProgressUpdateIntervalMillis != (int) status.getDouble(STATUS_PROGRESS_UPDATE_INTERVAL_MILLIS_KEY_PATH)) {
        mProgressUpdateIntervalMillis = (int) status.getDouble(STATUS_PROGRESS_UPDATE_INTERVAL_MILLIS_KEY_PATH);

        // Restart looper when update interval is changed
        if (mProgressUpdater.isLooping()) {
          stopUpdatingProgressIfNecessary();
          beginUpdatingProgressIfNecessary();
        }
      }
    }

    final Integer newPositionMillis;
    if (status.containsKey(STATUS_POSITION_MILLIS_KEY_PATH)) {
      // Even though we set the position with an int, this is a double in the map because iOS can
      // take a floating point value for positionMillis.
      newPositionMillis = (int) status.getDouble(STATUS_POSITION_MILLIS_KEY_PATH);
    } else {
      newPositionMillis = null;
    }

    if (status.containsKey(STATUS_SHOULD_PLAY_KEY_PATH)) {
      mShouldPlay = status.getBoolean(STATUS_SHOULD_PLAY_KEY_PATH);
    }

    if (status.containsKey(STATUS_RATE_KEY_PATH)) {
      mRate = (float) status.getDouble(STATUS_RATE_KEY_PATH);
    }

    if (status.containsKey(STATUS_SHOULD_CORRECT_PITCH_KEY_PATH)) {
      mShouldCorrectPitch = status.getBoolean(STATUS_SHOULD_CORRECT_PITCH_KEY_PATH);
    }

    if (status.containsKey(STATUS_VOLUME_KEY_PATH)) {
      mVolume = (float) status.getDouble(STATUS_VOLUME_KEY_PATH);
    }

    if (status.containsKey(STATUS_VOLUME_PAN_KEY_PATH)) {
      mPan = (float) status.getDouble(STATUS_VOLUME_PAN_KEY_PATH);
    }

    if (status.containsKey(STATUS_IS_MUTED_KEY_PATH)) {
      mIsMuted = status.getBoolean(STATUS_IS_MUTED_KEY_PATH);
    }

    final Boolean newIsLooping;
    if (status.containsKey(STATUS_IS_LOOPING_KEY_PATH)) {
      newIsLooping = status.getBoolean(STATUS_IS_LOOPING_KEY_PATH);
    } else {
      newIsLooping = null;
    }

    try {
      applyNewStatus(newPositionMillis, newIsLooping);
    } catch (final Throwable throwable) {
      mAVModule.abandonAudioFocusIfUnused();
      setStatusCompletionListener.onSetStatusError(throwable.toString());
      return;
    }

    mAVModule.abandonAudioFocusIfUnused();
    setStatusCompletionListener.onSetStatusComplete();
  }

  public final void setStatus(final Bundle status, final Promise promise) {
    if (status == null) {
      if (promise != null) {
        promise.reject("E_AV_SETSTATUS", "Cannot set null status.");
      }
      return;
    }

    try {
      setStatusWithListener(status, new SetStatusCompletionListener() {
        @Override
        public void onSetStatusComplete() {
          if (promise == null) {
            callStatusUpdateListener();
          } else {
            promise.resolve(getStatus());
          }
        }

        @Override
        public void onSetStatusError(final String error) {
          if (promise == null) {
            callStatusUpdateListener();
          } else {
            promise.reject("E_AV_SETSTATUS", error);
          }
        }
      });
    } catch (final Throwable throwable) {
      if (promise != null) {
        promise.reject("E_AV_SETSTATUS", "Encountered an error while setting status!", throwable);
      }
    }
  }

  final int getClippedIntegerForValue(final Integer value, final Integer min, final Integer max) {
    return (min != null && value < min) ? min : (max != null && value > max) ? max : value;
  }

  abstract boolean isLoaded();

  abstract void getExtraStatusFields(final Bundle map);

  // Sometimes another thread would release the player
  // in the middle of `getStatus()` call, which would result
  // in a null reference method invocation in `getExtraStatusFields`,
  // so we need to ensure nothing will release or nullify the property
  // while we get the latest status.
  public synchronized final Bundle getStatus() {
    if (!isLoaded()) {
      final Bundle map = getUnloadedStatus();
      map.putString(STATUS_ANDROID_IMPLEMENTATION_KEY_PATH, getImplementationName());
      return map;
    }

    final Bundle map = new Bundle();

    map.putBoolean(STATUS_IS_LOADED_KEY_PATH, true);
    map.putString(STATUS_ANDROID_IMPLEMENTATION_KEY_PATH, getImplementationName());

    map.putString(STATUS_URI_KEY_PATH, mUri.getPath());

    map.putInt(STATUS_PROGRESS_UPDATE_INTERVAL_MILLIS_KEY_PATH, mProgressUpdateIntervalMillis);
    // STATUS_DURATION_MILLIS_KEY_PATH, STATUS_POSITION_MILLIS_KEY_PATH,
    // and STATUS_PLAYABLE_DURATION_MILLIS_KEY_PATH are set in addExtraStatusFields().

    map.putBoolean(STATUS_SHOULD_PLAY_KEY_PATH, mShouldPlay);
    // STATUS_IS_PLAYING_KEY_PATH and STATUS_IS_BUFFERING_KEY_PATH are set
    // in addExtraStatusFields().

    map.putDouble(STATUS_RATE_KEY_PATH, (double) mRate);
    map.putBoolean(STATUS_SHOULD_CORRECT_PITCH_KEY_PATH, mShouldCorrectPitch);
    map.putDouble(STATUS_VOLUME_KEY_PATH, (double) mVolume);
    map.putDouble(STATUS_VOLUME_PAN_KEY_PATH, (double) mPan);
    map.putBoolean(STATUS_IS_MUTED_KEY_PATH, mIsMuted);
    // STATUS_IS_LOOPING_KEY_PATH is set in addExtraStatusFields().

    map.putBoolean(STATUS_DID_JUST_FINISH_KEY_PATH, false);

    getExtraStatusFields(map);

    return map;
  }

  // Video specific stuff

  public final void setVideoSizeUpdateListener(final VideoSizeUpdateListener videoSizeUpdateListener) {
    mVideoSizeUpdateListener = videoSizeUpdateListener;
  }

  public final void setFullscreenPresenter(final FullscreenPresenter fullscreenPresenter) {
    mFullscreenPresenter = fullscreenPresenter;
  }

  public abstract Pair<Integer, Integer> getVideoWidthHeight();

  public abstract void tryUpdateVideoSurface(final Surface surface);

  abstract int getAudioSessionId();

  public boolean isPresentedFullscreen() {
    return mFullscreenPresenter.isBeingPresentedFullscreen();
  }

  public void toggleFullscreen() {
    mFullscreenPresenter.setFullscreenMode(!isPresentedFullscreen());
  }

  // AudioEventHandler

  @Override
  public final void handleAudioFocusInterruptionBegan() {
    if (!mIsMuted) {
      pauseImmediately();
    }
  }

  @Override
  public final void handleAudioFocusGained() {
    try {
      playPlayerWithRateAndMuteIfNecessary();
    } catch (final AudioFocusNotAcquiredException e) {
      // This is ok -- we might be paused or audio might have been disabled.
    }
  }

  @Override
  public final void onPause() {
    pauseImmediately();
  }

  @Override
  public final void onResume() {
    try {
      playPlayerWithRateAndMuteIfNecessary();
    } catch (final AudioFocusNotAcquiredException e) {
      // Do nothing -- another app has audio focus for now, and handleAudioFocusGained() will be
      // called when it abandons it.
    }
  }

}
