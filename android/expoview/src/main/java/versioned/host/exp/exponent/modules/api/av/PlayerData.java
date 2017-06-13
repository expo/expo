package versioned.host.exp.exponent.modules.api.av;


import android.media.MediaPlayer;
import android.media.PlaybackParams;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.provider.MediaStore;
import android.support.annotation.RequiresApi;
import android.util.Pair;
import android.view.Surface;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

import java.util.Timer;
import java.util.TimerTask;

import host.exp.exponent.analytics.EXL;


public class PlayerData implements AudioEventHandler,
    MediaPlayer.OnBufferingUpdateListener,
    MediaPlayer.OnCompletionListener,
    MediaPlayer.OnErrorListener,
    MediaPlayer.OnInfoListener,
    MediaPlayer.OnSeekCompleteListener,
    MediaPlayer.OnVideoSizeChangedListener {

  public static final String PLAYER_DATA_STATUS_IS_LOADED_KEY_PATH = "isLoaded";
  public static final String PLAYER_DATA_STATUS_URI_KEY_PATH = "uri";
  public static final String PLAYER_DATA_STATUS_PROGRESS_UPDATE_INTERVAL_MILLIS_KEY_PATH = "progressUpdateIntervalMillis";
  public static final String PLAYER_DATA_STATUS_DURATION_MILLIS_KEY_PATH = "durationMillis";
  public static final String PLAYER_DATA_STATUS_POSITION_MILLIS_KEY_PATH = "positionMillis";
  public static final String PLAYER_DATA_STATUS_PLAYABLE_DURATION_MILLIS_KEY_PATH = "playableDurationMillis";
  public static final String PLAYER_DATA_STATUS_SHOULD_PLAY_KEY_PATH = "shouldPlay";
  public static final String PLAYER_DATA_STATUS_IS_PLAYING_KEY_PATH = "isPlaying";
  public static final String PLAYER_DATA_STATUS_IS_BUFFERING_KEY_PATH = "isBuffering";
  public static final String PLAYER_DATA_STATUS_RATE_KEY_PATH = "rate";
  public static final String PLAYER_DATA_STATUS_SHOULD_CORRECT_PITCH_KEY_PATH = "shouldCorrectPitch";
  public static final String PLAYER_DATA_STATUS_VOLUME_KEY_PATH = "volume";
  public static final String PLAYER_DATA_STATUS_IS_MUTED_KEY_PATH = "isMuted";
  public static final String PLAYER_DATA_STATUS_IS_LOOPING_KEY_PATH = "isLooping";
  public static final String PLAYER_DATA_STATUS_DID_JUST_FINISH_KEY_PATH = "didJustFinish";

  public static WritableMap getUnloadedStatus() {
    final WritableMap map = Arguments.createMap();
    map.putBoolean(PLAYER_DATA_STATUS_IS_LOADED_KEY_PATH, false);
    return map;
  }

  public interface PlayerDataVideoSizeUpdateListener {
    void onVideoSizeUpdate(final Pair<Integer, Integer> videoWidthHeight);
  }

  public interface PlayerDataErrorListener {
    void onError(final String error);
  }

  public interface PlayerDataLoadCompletionListener {
    void onLoadSuccess(final WritableMap status);
    void onLoadError(final String error);
  }

  public interface PlayerDataStatusUpdateListener {
    void onStatusUpdate(final WritableMap status);
  }

  // --------------------------------------------

  private interface PlayerDataSetStatusCompletionListener {
    void onSetStatusComplete();
    void onSetStatusError(final String error);
  }

  private MediaPlayer mMediaPlayer = null;
  private final Uri mUri;
  private boolean mMediaPlayerHasStartedEver = false;

  private final AVModule mAVModule;

  private int mProgressUpdateIntervalMillis = 500;
  private boolean mShouldPlay = false;
  private float mRate = 1.0f;
  private boolean mShouldCorrectPitch = false;
  private float mVolume = 1.0f;
  private boolean mIsMuted = false;

  private int mPlayableDurationMillis = 0;
  private boolean mIsBuffering = false;

  private PlayerDataErrorListener mErrorListener = null;
  private PlayerDataStatusUpdateListener mStatusUpdateListener = null;
  private PlayerDataVideoSizeUpdateListener mVideoSizeUpdateListener = null;
  private Timer mTimer = null;

  public PlayerData(final AVModule AVModule, final Uri uri) {
    mAVModule = AVModule;
    mUri = uri;
  }

  public void load(final ReadableMap status,
                   final PlayerDataLoadCompletionListener loadCompletionListener) {
    if (mMediaPlayer != null) {
      loadCompletionListener.onLoadError("Load encountered an error: PlayerData cannot be loaded twice.");
      return;
    }

    mMediaPlayer = MediaPlayer.create(mAVModule.mScopedContext, mUri);

    if (mMediaPlayer == null) {
      loadCompletionListener.onLoadError("Load encountered an error: MediaPlayer.create() returned null.");
    } else try {
      mMediaPlayer.setOnBufferingUpdateListener(this);
      mMediaPlayer.setOnCompletionListener(this);
      mMediaPlayer.setOnErrorListener(this);
      mMediaPlayer.setOnInfoListener(this);

      setStatus(status, new PlayerDataSetStatusCompletionListener() {
        @Override
        public void onSetStatusComplete() {
          loadCompletionListener.onLoadSuccess(getStatus());
        }

        @Override
        public void onSetStatusError(final String error) {
          loadCompletionListener.onLoadSuccess(getStatus());
        }
      });
    } catch (final Throwable throwable) {
      mMediaPlayer = null;
      loadCompletionListener.onLoadError("Load encountered an error: an exception was thrown with message: " + throwable.toString());
    }
  }

  // Status update listener

  private void callStatusUpdateListenerWithStatus(final WritableMap status) {
    if (mStatusUpdateListener != null) {
      mStatusUpdateListener.onStatusUpdate(status);
    }
  }

  private void callStatusUpdateListener() {
    callStatusUpdateListenerWithStatus(getStatus());
  }

  private void stopUpdatingProgressIfNecessary() {
    if (mTimer != null) {
      final Timer timer = mTimer;
      mTimer = null;
      timer.cancel();
    }
  }

  private void progressUpdateLoop() {
    if (mMediaPlayer != null && !mIsBuffering) {
      mTimer = new Timer();
      mTimer.schedule(new TimerTask() {
        @Override
        public void run() {
          callStatusUpdateListener();
          progressUpdateLoop();
        }
      }, mProgressUpdateIntervalMillis);
    } else {
      stopUpdatingProgressIfNecessary();
    }
  }

  private void beginUpdatingProgressIfNecessary() {
    if (mTimer == null) {
      progressUpdateLoop();
    }
  }

  public void setStatusUpdateListener(final PlayerDataStatusUpdateListener listener) {
    mStatusUpdateListener = listener;
    if (mStatusUpdateListener != null) {
      beginUpdatingProgressIfNecessary();
    }
  }

  // Error listener

  public void setErrorListener(final PlayerDataErrorListener listener) {
    mErrorListener = listener;
  }

  // AudioEventHandler

  @Override
  public void pauseImmediately() {
    if (mMediaPlayer != null && mMediaPlayerHasStartedEver) {
      mMediaPlayer.pause();
    }
    stopUpdatingProgressIfNecessary();
  }

  @Override
  public boolean requiresAudioFocus() {
    return mMediaPlayer != null && (mMediaPlayer.isPlaying() || shouldPlayerPlay()) && !mIsMuted;
  }

  @Override
  public void updateVolumeMuteAndDuck() {
    if (mMediaPlayer != null) {
      final float value = (!mAVModule.hasAudioFocus() || mIsMuted) ? 0f : mAVModule.mIsDuckingAudio ? mVolume / 2f : mVolume;
      mMediaPlayer.setVolume(value, value);
    }
  }

  // TODO (clarity) should these be folded together?
  // TODO ([onPause / handleAudioFocusInterruptionBegan => pauseImmediately] and [handleAudioFocusGained + onResume])
  @Override
  public void handleAudioFocusInterruptionBegan() {
    if (!mIsMuted) {
      pauseImmediately();
    }
  }

  @Override
  public void handleAudioFocusGained() {
    try {
      playPlayerWithRateAndMuteIfNecessary();
    } catch (final AVModule.AudioFocusNotAcquiredException e) {
      // This is ok -- we might be paused or audio might have been disabled.
    }
  }

  @Override
  public void onPause() {
    pauseImmediately();
  }

  @Override
  public void onResume() {
    try {
      playPlayerWithRateAndMuteIfNecessary();
    } catch (final AVModule.AudioFocusNotAcquiredException e) {
      // Do nothing -- another app has audio focus for now, and handleAudioFocusGained() will be
      // called when it abandons it.
    }
  }

  // Lifecycle

  public void release() {
    stopUpdatingProgressIfNecessary();
    if (mMediaPlayer != null) {
      mMediaPlayer.setOnBufferingUpdateListener(null);
      mMediaPlayer.setOnCompletionListener(null);
      mMediaPlayer.setOnErrorListener(null);
      mMediaPlayer.setOnInfoListener(null);
      mMediaPlayer.stop();
      mMediaPlayer.release();
      mMediaPlayer = null;
    }
  }

  // MediaPlayer.*Listener

  @Override
  public void onBufferingUpdate(final MediaPlayer mp, final int percent) {
    mPlayableDurationMillis = (int) (mp.getDuration() * (((double) percent) / 100.0));
    callStatusUpdateListener();
  }

  @Override
  public void onCompletion(final MediaPlayer mp) {
    final WritableMap status = getStatus();
    status.putBoolean(PLAYER_DATA_STATUS_DID_JUST_FINISH_KEY_PATH, true);
    callStatusUpdateListenerWithStatus(status);

    if (!mp.isLooping()) {
      mAVModule.abandonAudioFocusIfUnused();
    }
  }

  @Override
  public boolean onError(final MediaPlayer mp, final int what, final int extra) {
    release();
    if (mErrorListener != null) {
      mErrorListener.onError("MediaPlayer failed with 'what' code " + what + " and 'extra' code " + extra + ".");
    }
    return true;
  }

  @Override
  public boolean onInfo(final MediaPlayer mp, final int what, final int extra) {
    // Writing out all of the possible values here for clarity
    // @jesseruder @nikki93 I think we should hold off on handling some of the more obscure values
    // until the ExoPlayer refactor.
    switch (what) {
      case MediaPlayer.MEDIA_INFO_UNKNOWN:
        break;
      case MediaPlayer.MEDIA_INFO_BUFFERING_START:
        mIsBuffering = true;
        break;
      case MediaPlayer.MEDIA_INFO_BUFFERING_END:
        mIsBuffering = false;
        beginUpdatingProgressIfNecessary();
        break;
      case MediaPlayer.MEDIA_INFO_BAD_INTERLEAVING:
        break;
      case MediaPlayer.MEDIA_INFO_NOT_SEEKABLE:
        break;
      case MediaPlayer.MEDIA_INFO_METADATA_UPDATE:
        break;
      case MediaPlayer.MEDIA_INFO_UNSUPPORTED_SUBTITLE:
        break;
      case MediaPlayer.MEDIA_INFO_SUBTITLE_TIMED_OUT:
        break;
      case MediaPlayer.MEDIA_INFO_VIDEO_RENDERING_START:
        if (mVideoSizeUpdateListener != null) {
          mVideoSizeUpdateListener.onVideoSizeUpdate(new Pair<>(mp.getVideoWidth(), mp.getVideoHeight()));
        }
        break;
      case MediaPlayer.MEDIA_INFO_VIDEO_TRACK_LAGGING:
        break;
    }
    callStatusUpdateListener();
    return true;
  }

  @Override
  public void onSeekComplete(final MediaPlayer mp) {
    callStatusUpdateListener();
  }

  @Override
  public void onVideoSizeChanged(final MediaPlayer mp, final int width, final int height) {
    if (mVideoSizeUpdateListener != null) {
      mVideoSizeUpdateListener.onVideoSizeUpdate(new Pair<>(width, height));
    }
  }

  // Set status

  private boolean shouldPlayerPlay() {
    return mShouldPlay && mRate > 0.0;
  }

  @RequiresApi(api = Build.VERSION_CODES.M)
  private void playMediaPlayerWithRateMAndHigher(final float rate) {
    final PlaybackParams params = mMediaPlayer.getPlaybackParams();
    params.setPitch(mShouldCorrectPitch ? 1.0f : rate);
    params.setSpeed(rate);
    params.setAudioFallbackMode(PlaybackParams.AUDIO_FALLBACK_MODE_DEFAULT);
    mMediaPlayer.setPlaybackParams(params);
    mMediaPlayer.start();
  }

  private void playPlayerWithRateAndMuteIfNecessary() throws AVModule.AudioFocusNotAcquiredException {
    if (mMediaPlayer == null || !shouldPlayerPlay()) {
      return;
    }

    if (!mIsMuted) {
      mAVModule.acquireAudioFocus();
    }

    updateVolumeMuteAndDuck();

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      if (!mMediaPlayer.isPlaying()) {
        mMediaPlayer.start();
        mMediaPlayerHasStartedEver = true;
      }
    } else {
      boolean rateAndPitchAreSetCorrectly;
      try {
        final PlaybackParams params = mMediaPlayer.getPlaybackParams();
        final float setRate = params.getSpeed();
        final boolean setShouldCorrectPitch = params.getPitch() == 1.0f;
        rateAndPitchAreSetCorrectly = setRate == mRate && setShouldCorrectPitch == mShouldCorrectPitch;
      } catch (final Throwable throwable) {
        rateAndPitchAreSetCorrectly = false;
      }
      if (mRate != 0 && (!mMediaPlayer.isPlaying() || !rateAndPitchAreSetCorrectly)) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
          playMediaPlayerWithRateMAndHigher(mRate);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          // Bizarrely, I wasn't able to change rate while a sound was playing unless I had
          // changed the rate to something other than 1f before the sound started.
          // This workaround seems to fix this issue (which is said to only be fixed in N):
          // https://code.google.com/p/android/issues/detail?id=192135
          playMediaPlayerWithRateMAndHigher(2f);
          mMediaPlayer.pause();
          playMediaPlayerWithRateMAndHigher(mRate);
        }
        mMediaPlayerHasStartedEver = true;
      }
    }
    beginUpdatingProgressIfNecessary();
  }

  private void setStatus(final ReadableMap status, final PlayerDataSetStatusCompletionListener setStatusCompletionListener) {
    if (mMediaPlayer == null) {
      throw new IllegalStateException();
    }

    if (status.hasKey(PLAYER_DATA_STATUS_PROGRESS_UPDATE_INTERVAL_MILLIS_KEY_PATH)) {
      mProgressUpdateIntervalMillis = (int) status.getDouble(PLAYER_DATA_STATUS_PROGRESS_UPDATE_INTERVAL_MILLIS_KEY_PATH);
    }

    // Even though we set the position of mMediaPlayer with an int, this is a double in the map because iOS can
    // take a floating point value for positionMillis.
    Double newPosition = null;
    if (status.hasKey(PLAYER_DATA_STATUS_POSITION_MILLIS_KEY_PATH)) {
      final Double potentialNewPosition = status.getDouble(PLAYER_DATA_STATUS_POSITION_MILLIS_KEY_PATH);
      if (mMediaPlayer == null || potentialNewPosition.intValue() != mMediaPlayer.getCurrentPosition()) {
        newPosition = potentialNewPosition;
      }
    }

    if (status.hasKey(PLAYER_DATA_STATUS_SHOULD_PLAY_KEY_PATH)) {
      mShouldPlay = status.getBoolean(PLAYER_DATA_STATUS_SHOULD_PLAY_KEY_PATH);
    }

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      if (status.hasKey(PLAYER_DATA_STATUS_RATE_KEY_PATH) && status.getDouble(PLAYER_DATA_STATUS_RATE_KEY_PATH) != 1.0) {
        EXL.w("Expo PlayerData", "Cannot set audio/video playback rate for Android SDK < 23.");
      }
    } else {
      if (status.hasKey(PLAYER_DATA_STATUS_RATE_KEY_PATH)) {
        mRate = (float) status.getDouble(PLAYER_DATA_STATUS_RATE_KEY_PATH);
      }

      if (status.hasKey(PLAYER_DATA_STATUS_SHOULD_CORRECT_PITCH_KEY_PATH)) {
        mShouldCorrectPitch = status.getBoolean(PLAYER_DATA_STATUS_SHOULD_CORRECT_PITCH_KEY_PATH);
      }
    }

    if (status.hasKey(PLAYER_DATA_STATUS_VOLUME_KEY_PATH)) {
      mVolume = (float) status.getDouble(PLAYER_DATA_STATUS_VOLUME_KEY_PATH);
    }

    if (status.hasKey(PLAYER_DATA_STATUS_IS_MUTED_KEY_PATH)) {
      mIsMuted = status.getBoolean(PLAYER_DATA_STATUS_IS_MUTED_KEY_PATH);
    }

    if (mMediaPlayer != null && status.hasKey(PLAYER_DATA_STATUS_IS_LOOPING_KEY_PATH)) {
      mMediaPlayer.setLooping(status.getBoolean(PLAYER_DATA_STATUS_IS_LOOPING_KEY_PATH)); // Idempotent
    }

    // Pause first if necessary.
    if (!shouldPlayerPlay()) {
      if (mMediaPlayerHasStartedEver) {
        mMediaPlayer.pause();
      }
      stopUpdatingProgressIfNecessary();
    }

    // Mute / update volume if it doesn't require a request of the audio focus.
    updateVolumeMuteAndDuck();

    // Seek
    if (newPosition != null) {
      mMediaPlayer.seekTo(newPosition.intValue());
    }

    // Play / unmute
    try {
      playPlayerWithRateAndMuteIfNecessary();
    } catch (final AVModule.AudioFocusNotAcquiredException e) {
      mAVModule.abandonAudioFocusIfUnused();
      setStatusCompletionListener.onSetStatusError(e.getMessage());
      return;
    }

    mAVModule.abandonAudioFocusIfUnused();
    setStatusCompletionListener.onSetStatusComplete();
  }

  public void setStatus(final ReadableMap status, final Promise promise) {
    if (status == null) {
      if (promise != null) {
        promise.reject("E_AV_SETSTATUS", "Cannot set null status.");
      }
      return;
    }

    try {
      setStatus(status, new PlayerDataSetStatusCompletionListener() {
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

  // Get status

  private int getClippedIntForValue(final int value, final int min, final int max) {
    return value < min ? min : value > max ? max : value;
  }

  public WritableMap getStatus() {
    if (mMediaPlayer == null) {
      return getUnloadedStatus();
    }

    int duration = mMediaPlayer.getDuration();
    duration = duration < 0 ? 0 : duration;

    final WritableMap map = Arguments.createMap();

    map.putBoolean(PLAYER_DATA_STATUS_IS_LOADED_KEY_PATH, true);
    map.putString(PLAYER_DATA_STATUS_URI_KEY_PATH, mUri.getPath());

    map.putInt(PLAYER_DATA_STATUS_PROGRESS_UPDATE_INTERVAL_MILLIS_KEY_PATH, mProgressUpdateIntervalMillis);
    map.putInt(PLAYER_DATA_STATUS_DURATION_MILLIS_KEY_PATH, duration);
    map.putInt(PLAYER_DATA_STATUS_POSITION_MILLIS_KEY_PATH, getClippedIntForValue(mMediaPlayer.getCurrentPosition(), 0, duration));
    map.putInt(PLAYER_DATA_STATUS_PLAYABLE_DURATION_MILLIS_KEY_PATH, getClippedIntForValue(mPlayableDurationMillis, 0, duration));

    map.putBoolean(PLAYER_DATA_STATUS_SHOULD_PLAY_KEY_PATH, mShouldPlay);
    map.putBoolean(PLAYER_DATA_STATUS_IS_PLAYING_KEY_PATH, mMediaPlayer.isPlaying());
    map.putBoolean(PLAYER_DATA_STATUS_IS_BUFFERING_KEY_PATH, mIsBuffering);

    map.putDouble(PLAYER_DATA_STATUS_RATE_KEY_PATH, mRate);
    map.putBoolean(PLAYER_DATA_STATUS_SHOULD_CORRECT_PITCH_KEY_PATH, mShouldCorrectPitch);
    map.putDouble(PLAYER_DATA_STATUS_VOLUME_KEY_PATH, mVolume);
    map.putBoolean(PLAYER_DATA_STATUS_IS_MUTED_KEY_PATH, mIsMuted);
    map.putBoolean(PLAYER_DATA_STATUS_IS_LOOPING_KEY_PATH, mMediaPlayer.isLooping());

    map.putBoolean(PLAYER_DATA_STATUS_DID_JUST_FINISH_KEY_PATH, false);

    return map;
  }

  // Video specific stuff

  public void setVideoSizeUpdateListener(final PlayerDataVideoSizeUpdateListener videoSizeUpdateListener) {
    mVideoSizeUpdateListener = videoSizeUpdateListener;
  }

  public Pair<Integer, Integer> getVideoWidthHeight() {
    return mMediaPlayer == null ? new Pair<>(0, 0) : new Pair<>(mMediaPlayer.getVideoWidth(), mMediaPlayer.getVideoHeight());
  }

  public void updateVideoSurface(final Surface surface) {
    mMediaPlayer.setScreenOnWhilePlaying(surface != null);
    mMediaPlayer.setSurface(surface);
  }

  public int getAudioSessionId() {
    return mMediaPlayer != null ? mMediaPlayer.getAudioSessionId() : 0;
  }
}
