// Copyright 2015-present 650 Industries. All rights reserved.

package abi16_0_0.host.exp.exponent.modules.api;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.MediaRecorder;
import android.media.PlaybackParams;
import android.net.Uri;
import android.os.Build;
import android.support.annotation.RequiresApi;
import android.support.v4.content.ContextCompat;

import abi16_0_0.com.facebook.react.bridge.Arguments;
import abi16_0_0.com.facebook.react.bridge.Callback;
import abi16_0_0.com.facebook.react.bridge.LifecycleEventListener;
import abi16_0_0.com.facebook.react.bridge.Promise;
import abi16_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi16_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi16_0_0.com.facebook.react.bridge.ReactMethod;
import abi16_0_0.com.facebook.react.bridge.ReadableMap;
import abi16_0_0.com.facebook.react.bridge.WritableMap;
import abi16_0_0.com.facebook.react.common.SystemClock;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import host.exp.exponent.utils.ExpFileUtils;
import host.exp.exponent.utils.ScopedContext;

public class AudioModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
  private static final float INITIAL_VOLUME = 1f;
  private static final float INITIAL_RATE = 1f;
  private static final String AUDIO_MODE_SHOULD_DUCK_KEY = "shouldDuckAndroid";
  private static final String AUDIO_MODE_INTERRUPTION_MODE_KEY = "interruptionModeAndroid";

  private class PlayerData {
    final MediaPlayer mMediaPlayer;
    float mVolume;
    boolean mMuted;
    float mRate;
    boolean mShouldCorrectPitch;
    Callback mFinishCallback;

    PlayerData(final MediaPlayer mediaPlayer,
               final float volume,
               final boolean muted,
               final float rate,
               final boolean shouldCorrectPitch) {
      this.mMediaPlayer = mediaPlayer;
      this.mVolume = volume;
      this.mMuted = muted;
      this.mRate = rate;
      this.mShouldCorrectPitch = shouldCorrectPitch;

      mMediaPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
        @Override
        public void onCompletion(final MediaPlayer mediaPlayer) {
          if (!mediaPlayer.isLooping()) {
            if (mFinishCallback != null) {
              mFinishCallback.invoke(getStatus());
              mFinishCallback = null; // Callback can only be invoked once.
            }
            abandonAudioFocusIfNoPlayersPlaying();
          }
        }
      });
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    private void playMediaPlayerWithRateMAndHigher() {
      final PlaybackParams params = this.mMediaPlayer.getPlaybackParams();
      params.setPitch(mShouldCorrectPitch ? 1.0f : mRate);
      params.setSpeed(mRate);
      this.mMediaPlayer.setPlaybackParams(params);
      this.mMediaPlayer.start();
    }

    void playMediaPlayerWithRateDependingOnVersion() {
      if (mRate == 0 || this.mMediaPlayer.isPlaying()) {
        return;
      }

      setVolumeAndMuteWithDuck(mMuted, mVolume); // Just in case duck status has changed.
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        playMediaPlayerWithRateMAndHigher();
      } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        // Bizarrely, I wasn't able to change rate while a sound was playing unless I had
        // changed the rate to something other than 1f before the sound started.
        // This workaround seems to fix this issue (which is said to only be fixed in N):
        // https://code.google.com/p/android/issues/detail?id=192135
        final float actualRate = mRate;
        this.mRate = 2f;
        playMediaPlayerWithRateMAndHigher();
        this.mMediaPlayer.pause();
        this.mRate = actualRate;
        playMediaPlayerWithRateMAndHigher();
      } else {
        this.mMediaPlayer.start();
      }
    }

    void setVolumeAndMuteWithDuck(final boolean muted, final float volume) {
      final float value = muted ? 0f : mIsDucking ? volume / 2f : volume;
      mMediaPlayer.setVolume(value, value);
      mMuted = muted;
      mVolume = volume;
    }

    WritableMap getStatus() {
      final WritableMap map = Arguments.createMap();
      map.putInt("positionMillis", this.mMediaPlayer.getCurrentPosition());
      map.putDouble("rate", this.mRate);
      map.putBoolean("shouldCorrectPitch", this.mShouldCorrectPitch);
      map.putBoolean("isPlaying", this.mMediaPlayer.isPlaying());
      map.putDouble("volume", this.mVolume);
      map.putBoolean("isMuted", this.mMuted);
      map.putBoolean("isLooping", this.mMediaPlayer.isLooping());
      return map;
    }
  }

  private enum InterruptionMode {
    DO_NOT_MIX,
    DUCK_OTHERS,
  }

  // There will never be many PlayerData objects in the map, so HashMap is most efficient:
  private final Map<Integer, PlayerData> mPlayerDataPool = new HashMap<>();
  private final Set<Integer> mPausedOnPauseSet = new HashSet<>();
  private final Set<Integer> mPausedOnAudioFocusLossSet = new HashSet<>();
  private final ReactApplicationContext mContext;
  private final ScopedContext mScopedContext;
  private final AudioManager mAudioManager;
  private final AudioManager.OnAudioFocusChangeListener mAFChangeListener;
  private final BroadcastReceiver mNoisyAudioStreamReceiver;
  private InterruptionMode mInterruptionMode = InterruptionMode.DUCK_OTHERS;
  private boolean mShouldDuck = true;
  private boolean mIsDucking = false;
  private boolean mPaused = false;
  private boolean mAcquiredAudioFocus = false;
  private int mKeyCount = 0;
  private MediaRecorder mRecorder = null;
  private String mRecordingFilePath = null;
  private long mRecorderUptimeOfLastStartResume = 0L;
  private long mRecorderDurationAlreadyRecorded = 0L;
  private boolean mRecorderIsRecording = false;
  private boolean mRecorderIsPaused = false;

  @Override
  public String getName() {
    return "ExponentAudio";
  }

  public AudioModule(final ReactApplicationContext reactContext, final ScopedContext scopedContext) {
    super(reactContext);
    this.mContext = reactContext;
    this.mScopedContext = scopedContext;
    this.mAudioManager = (AudioManager) mContext.getSystemService(Context.AUDIO_SERVICE);

    // Implemented because of the suggestion here:
    // https://developer.android.com/guide/topics/media-apps/volume-and-earphones.html
    mNoisyAudioStreamReceiver = new BroadcastReceiver() {
      @Override
      public void onReceive(Context context, Intent intent) {
        if (AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction())) {
          pauseAll(null);
        }
      }
    };

    mAFChangeListener = new AudioManager.OnAudioFocusChangeListener() {
      public void onAudioFocusChange(int focusChange) {
        if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {
          mIsDucking = false;
          pauseAll(null); // Permanent loss of focus
          mAcquiredAudioFocus = false;
        } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
          mIsDucking = false;
          pauseAll(mPausedOnAudioFocusLossSet);
          mAcquiredAudioFocus = false;
        } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
          if (mShouldDuck) {
            mIsDucking = true;
            updateDuckStatusForAllPlayersPlaying();
          } else {
            pauseAll(mPausedOnAudioFocusLossSet);
            mAcquiredAudioFocus = false;
          }
        } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
          mAcquiredAudioFocus = true;
          resumeAllThatWerePaused(mPausedOnAudioFocusLossSet);
          mIsDucking = false;
          updateDuckStatusForAllPlayersPlaying();
        }
      }
    };

    reactContext.registerReceiver(mNoisyAudioStreamReceiver,
        new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY));
    reactContext.addLifecycleEventListener(this);
  }

  private boolean isMissingRecordingPermissions() {
    return Build.VERSION.SDK_INT >= 23 &&
        ContextCompat.checkSelfPermission(getReactApplicationContext(), Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED;
  }

  // Rejects the promise and returns null if the PlayerData is not found.
  private PlayerData tryGetDataForKey(final Integer key, final Promise promise) {
    final PlayerData data = this.mPlayerDataPool.get(key);
    if (data == null && promise != null) {
      promise.reject("E_AUDIO_NOPLAYER", "Player does not exist.");
    }
    return data;
  }

  // Rejects the promise and returns false if the MediaRecorder is not found.
  private boolean checkRecorderExistsOrReject(final Promise promise) {
    if (mRecorder == null && promise != null) {
      promise.reject("E_AUDIO_NORECORDER", "Recorder does not exist.");
    }
    return mRecorder != null;
  }

  private long getRecorderDurationMillis() {
    if (mRecorder == null) {
      return 0L;
    }
    long duration = mRecorderDurationAlreadyRecorded;
    if (mRecorderIsRecording && mRecorderUptimeOfLastStartResume > 0) {
      duration += SystemClock.uptimeMillis() - mRecorderUptimeOfLastStartResume;
    }
    return duration;
  }

  private WritableMap getRecorderStatus() {
    final WritableMap map = Arguments.createMap();
    map.putBoolean("isRecording", mRecorderIsRecording);
    map.putInt("durationMillis", (int) getRecorderDurationMillis());
    return map;
  }

  private int getNumPlayersPlaying() {
    // mPlayerDataPool will never be very big, so this is OK (rather than maintaining a member variable count)
    int count = 0;
    for (final PlayerData data : mPlayerDataPool.values()) {
      if (data.mMediaPlayer.isPlaying()) {
        count++;
      }
    }
    return count;
  }

  private boolean tryAcquireAudioFocus() {
    if (mAcquiredAudioFocus) {
      return true;
    }

    final int audioFocusRequest = mInterruptionMode == InterruptionMode.DO_NOT_MIX
        ? AudioManager.AUDIOFOCUS_GAIN : AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK;

    int result = mAudioManager.requestAudioFocus(mAFChangeListener,
        AudioManager.STREAM_MUSIC, audioFocusRequest);
    mAcquiredAudioFocus = result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    return mAcquiredAudioFocus;
  }

  private void abandonAudioFocus() {
    mAcquiredAudioFocus = false;
    mAudioManager.abandonAudioFocus(mAFChangeListener);
  }

  private void abandonAudioFocusIfNoPlayersPlaying() {
    if (getNumPlayersPlaying() == 0) {
      abandonAudioFocus();
    }
  }

  private void pauseAll(final Set<Integer> pausedSet) {
    for (final Map.Entry<Integer, PlayerData> keyDataPair : mPlayerDataPool.entrySet()) {
      final MediaPlayer mediaPlayer = keyDataPair.getValue().mMediaPlayer;
      if (pausedSet != null && mediaPlayer.isPlaying()) {
        pausedSet.add(keyDataPair.getKey());
      }
      if (mediaPlayer.isPlaying()) {
        mediaPlayer.pause();
      }
    }
    abandonAudioFocus();
  }

  private void resumeAllThatWerePaused(final Set<Integer> pausedSet) {
    for (final Integer key : pausedSet) {
      if (tryAcquireAudioFocus()) {
        final PlayerData data = this.mPlayerDataPool.get(key);
        if (data != null) {
          data.playMediaPlayerWithRateDependingOnVersion();
        }
      }
    }
    pausedSet.clear();
  }

  private void updateDuckStatusForAllPlayersPlaying() {
    for (final Map.Entry<Integer, PlayerData> keyDataPair : mPlayerDataPool.entrySet()) {
      final PlayerData data = keyDataPair.getValue();
      if (data.mMediaPlayer.isPlaying()) {
        data.setVolumeAndMuteWithDuck(data.mMuted, data.mVolume);
      }
    }
  }

  private void removePlayerForKey(final Integer key) {
    final PlayerData data = this.mPlayerDataPool.get(key);
    if (data != null) {
      data.mMediaPlayer.stop();
      abandonAudioFocusIfNoPlayersPlaying();
      data.mMediaPlayer.release();
    }
    this.mPlayerDataPool.remove(key);
    this.mPausedOnPauseSet.remove(key);
    this.mPausedOnAudioFocusLossSet.remove(key);
  }

  private void removeRecorder() {
    if (mRecorder != null) {
      try {
        mRecorder.stop();
      } catch (final RuntimeException e) {
        // Do nothing-- this just means that the recorder is already stopped,
        // or was stopped immediately after starting.
      }
      mRecorder.release();
      mRecorder = null;
    }

    mRecordingFilePath = null;
    mRecorderIsRecording = false;
    mRecorderIsPaused = false;
    mRecorderDurationAlreadyRecorded = 0L;
    mRecorderUptimeOfLastStartResume = 0L;
  }

  @ReactMethod
  public void setIsEnabled(final Boolean value, final Promise promise) {
    // The JS side prevents any calls from coming through if Audio is disabled,
    // so we just need to stop audio in native when the flag is unset.
    if (!value) {
      pauseAll(null);
      this.mPausedOnPauseSet.clear();
      this.mPausedOnAudioFocusLossSet.clear();
    }
    promise.resolve(null);
  }

  @ReactMethod
  public void setAudioMode(final ReadableMap map, final Promise promise) {
    mShouldDuck = map.getBoolean(AUDIO_MODE_SHOULD_DUCK_KEY);
    if (!mShouldDuck) {
      mIsDucking = false;
      updateDuckStatusForAllPlayersPlaying();
    }

    final int interruptionModeInt = map.getInt(AUDIO_MODE_INTERRUPTION_MODE_KEY);
    switch (interruptionModeInt) {
      case 1:
        mInterruptionMode = InterruptionMode.DO_NOT_MIX;
      case 2:
      default:
        mInterruptionMode = InterruptionMode.DUCK_OTHERS;
    }
    promise.resolve(null);
  }

  @ReactMethod
  public void load(final String uriString, final Promise promise) {
    final Uri uri = Uri.parse(uriString);
    final MediaPlayer player = MediaPlayer.create(this.mContext, uri);
    if (player == null) {
      promise.reject("E_AUDIO_PLAYERNOTCREATED", "Load encountered an error: player not created.");
      return;
    }

    player.setOnPreparedListener(new MediaPlayer.OnPreparedListener() {
      public void onPrepared(MediaPlayer mp) {
        mp.setVolume(INITIAL_VOLUME, INITIAL_VOLUME);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          final PlaybackParams params = new PlaybackParams();
          params.setPitch(INITIAL_RATE);
          params.setSpeed(INITIAL_RATE);
          params.setAudioFallbackMode(PlaybackParams.AUDIO_FALLBACK_MODE_MUTE);
          player.setPlaybackParams(params);
        }

        final int key = mKeyCount++;
        final PlayerData data = new PlayerData(mp, INITIAL_VOLUME, false, INITIAL_RATE, false);

        mPlayerDataPool.put(key, data);

        final WritableMap map = Arguments.createMap();
        map.putInt("key", key);
        map.putInt("durationMillis", mp.getDuration());
        map.putMap("status", data.getStatus());
        promise.resolve(map);
      }
    });
  }

  @ReactMethod
  public void play(final Integer key, final Promise promise) {
    final PlayerData data = tryGetDataForKey(key, promise);
    if (data == null) {
      return; // tryGetDataForKey has already rejected the promise.
    }

    if (tryAcquireAudioFocus() && !mPaused) {
      data.playMediaPlayerWithRateDependingOnVersion();
    }

    final WritableMap map = Arguments.createMap();
    map.putMap("status", data.getStatus());
    promise.resolve(map);
  }

  @ReactMethod
  public void pause(final Integer key, final Promise promise) {
    final PlayerData data = tryGetDataForKey(key, promise);
    if (data == null) {
      return; // tryGetDataForKey has already rejected the promise.
    }

    if (data.mMediaPlayer.isPlaying()) {
      data.mMediaPlayer.pause();
    }
    abandonAudioFocusIfNoPlayersPlaying();

    final WritableMap map = Arguments.createMap();
    map.putMap("status", data.getStatus());
    promise.resolve(map);
  }

  @ReactMethod
  public void stop(final Integer key, final Promise promise) {
    final PlayerData data = tryGetDataForKey(key, promise);
    if (data == null) {
      return; // tryGetDataForKey has already rejected the promise.
    }

    data.mMediaPlayer.seekTo(0);
    if (data.mMediaPlayer.isPlaying()) {
      data.mMediaPlayer.pause();
    }
    abandonAudioFocusIfNoPlayersPlaying();

    final WritableMap map = Arguments.createMap();
    map.putMap("status", data.getStatus());
    promise.resolve(map);
  }

  @ReactMethod
  public void unload(final Integer key, final Promise promise) {
    if (tryGetDataForKey(key, promise) == null) {
      return; // tryGetDataForKey has already rejected the promise.
    }

    removePlayerForKey(key);
    abandonAudioFocusIfNoPlayersPlaying();

    promise.resolve(null);
  }

  @ReactMethod
  public void setPosition(final Integer key, final Integer millis, final Promise promise) {
    final PlayerData data = tryGetDataForKey(key, promise);
    if (data == null) {
      return; // tryGetDataForKey has already rejected the promise.
    }

    data.mMediaPlayer.seekTo(millis);

    final WritableMap map = Arguments.createMap();
    map.putMap("status", data.getStatus());
    promise.resolve(map);
  }

  @ReactMethod
  public void setRate(final Integer key, final Double value, final boolean shouldCorrectPitch, final Promise promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      promise.reject("E_AUDIO_VERSIONINCOMPATIBLE", "Changing rate is unsupported on Android devices running SDK < 23.");
    } else {
      final PlayerData data = tryGetDataForKey(key, promise);
      if (data == null) {
        return; // tryGetDataForKey has already rejected the promise.
      }

      final float rate = value.floatValue();
      if (data.mMediaPlayer.isPlaying()) {
        if (value == 0.0) {
          data.mMediaPlayer.pause();
        } else {
          final PlaybackParams params = data.mMediaPlayer.getPlaybackParams();
          params.setPitch(shouldCorrectPitch ? 1.0f : rate);
          params.setSpeed(rate);
          data.mMediaPlayer.setPlaybackParams(params);
        }
      }
      data.mRate = rate;
      data.mShouldCorrectPitch = shouldCorrectPitch;

      final WritableMap map = Arguments.createMap();
      map.putMap("status", data.getStatus());
      promise.resolve(map);
    }
  }

  @ReactMethod
  public void setVolume(final Integer key, final Double value, final Promise promise) {
    final PlayerData data = tryGetDataForKey(key, promise);
    if (data == null) {
      return; // tryGetDataForKey has already rejected the promise.
    }

    data.setVolumeAndMuteWithDuck(data.mMuted, value.floatValue());

    final WritableMap map = Arguments.createMap();
    map.putMap("status", data.getStatus());
    promise.resolve(map);
  }

  @ReactMethod
  public void setIsMuted(final Integer key, final Boolean value, final Promise promise) {
    final PlayerData data = tryGetDataForKey(key, promise);
    if (data == null) {
      return; // tryGetDataForKey has already rejected the promise.
    }

    data.setVolumeAndMuteWithDuck(value, data.mVolume);

    final WritableMap map = Arguments.createMap();
    map.putMap("status", data.getStatus());
    promise.resolve(map);
  }

  @ReactMethod
  public void setIsLooping(final Integer key, final Boolean value, final Promise promise) {
    final PlayerData data = tryGetDataForKey(key, promise);
    if (data == null) {
      return; // tryGetDataForKey has already rejected the promise.
    }

    data.mMediaPlayer.setLooping(value);

    final WritableMap map = Arguments.createMap();
    map.putMap("status", data.getStatus());
    promise.resolve(map);
  }

  @ReactMethod
  public void getStatus(final Integer key, final Promise promise) {
    final PlayerData data = tryGetDataForKey(key, promise);
    if (data == null) {
      return; // tryGetDataForKey has already rejected the promise.
    }

    final WritableMap map = Arguments.createMap();
    map.putMap("status", data.getStatus());
    promise.resolve(map);
  }

  @ReactMethod
  public void setPlaybackFinishedCallback(final Integer key, final Callback callback) {
    final PlayerData data = tryGetDataForKey(key, null);
    if (data == null) {
      return;
    }

    data.mFinishCallback = callback;
  }


  @ReactMethod
  public void prepareToRecord(final Promise promise) {
    if (isMissingRecordingPermissions()) {
      promise.reject("E_MISSING_PERMISSION", "Missing audio recording permissions.");
      return;
    }

    removeRecorder();

    final String filename = "recording-" + UUID.randomUUID().toString() + ".3gp";
    final WritableMap pathOptions = Arguments.createMap();
    pathOptions.putBoolean("cache", true);
    try {
      final File directory = new File(mScopedContext.toScopedPath("Audio", pathOptions));
      ExpFileUtils.ensureDirExists(directory);
      mRecordingFilePath = directory + File.separator + filename;
    } catch (final IOException e) {
      // This only occurs in the case that the scoped path is not in this experience's scope,
      // which is never true.
    }

    mRecorder = new MediaRecorder();
    mRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
    mRecorder.setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP);
    mRecorder.setOutputFile(mRecordingFilePath);
    mRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB);

    try {
      mRecorder.prepare();
    } catch (final Exception e) {
      promise.reject("E_AUDIO_RECORDERNOTCREATED", "Prepare encountered an error: recorder not prepared", e);
      removeRecorder();
      return;
    }

    final WritableMap map = Arguments.createMap();
    map.putString("uri", mRecordingFilePath);
    map.putMap("status", getRecorderStatus());
    promise.resolve(map);
  }

  @ReactMethod
  public void startRecording(final Promise promise) {
    if (isMissingRecordingPermissions()) {
      promise.reject("E_MISSING_PERMISSION", "Missing audio recording permissions.");
      return;
    }

    if (checkRecorderExistsOrReject(promise)) {
      try {
        if (mRecorderIsPaused && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
          mRecorder.resume();
        } else {
          mRecorder.start();
        }
      } catch (final IllegalStateException e) {
        promise.reject("E_AUDIO_RECORDING", "Start encountered an error: recording not started", e);
        return;
      }

      mRecorderUptimeOfLastStartResume = SystemClock.uptimeMillis();
      mRecorderIsRecording = true;
      mRecorderIsPaused = false;

      final WritableMap map = Arguments.createMap();
      map.putMap("status", getRecorderStatus());
      promise.resolve(map);
    }
  }

  @ReactMethod
  public void pauseRecording(final Promise promise) {
    if (checkRecorderExistsOrReject(promise)) {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
        promise.reject("E_AUDIO_VERSIONINCOMPATIBLE", "Pausing an audio recording is unsupported on" +
            " Android devices running SDK < 24.");
      } else {
        try {
          mRecorder.pause();
        } catch (final IllegalStateException e) {
          promise.reject("E_AUDIO_RECORDINGPAUSE", "Pause encountered an error: recording not paused", e);
          return;
        }

        mRecorderDurationAlreadyRecorded = getRecorderDurationMillis();
        mRecorderIsRecording = false;
        mRecorderIsPaused = true;

        final WritableMap map = Arguments.createMap();
        map.putMap("status", getRecorderStatus());
        promise.resolve(map);
      }
    }
  }

  @ReactMethod
  public void stopRecording(final Promise promise) {
    if (checkRecorderExistsOrReject(promise)) {
      try {
        mRecorder.stop();
      } catch (final RuntimeException e) {
        promise.reject("E_AUDIO_RECORDINGSTOP", "Stop encountered an error: recording not stopped", e);
        return;
      }

      mRecorderDurationAlreadyRecorded = getRecorderDurationMillis();
      mRecorderIsRecording = false;
      mRecorderIsPaused = false;

      final WritableMap map = Arguments.createMap();
      map.putMap("status", getRecorderStatus());
      promise.resolve(map);
    }
  }

  @ReactMethod
  public void getRecordingStatus(final Promise promise) {
    if (checkRecorderExistsOrReject(promise)) {
      final WritableMap map = Arguments.createMap();
      map.putMap("status", getRecorderStatus());
      promise.resolve(map);
    }
  }

  @ReactMethod
  public void unloadRecorder(final Promise promise) {
    if (checkRecorderExistsOrReject(promise)) {
      removeRecorder();
      promise.resolve(null);
    }
  }

  @Override
  public void onHostResume() {
    if (mPaused) {
      mPaused = false;
      resumeAllThatWerePaused(mPausedOnPauseSet);
    }
  }

  @Override
  public void onHostPause() {
    if (!mPaused) {
      mPaused = true;
      pauseAll(mPausedOnPauseSet);
    }
  }

  @Override
  public void onHostDestroy() {
    mContext.unregisterReceiver(mNoisyAudioStreamReceiver);
    for (final Integer key : mPlayerDataPool.keySet()) {
      removePlayerForKey(key);
    }
    removeRecorder();
    abandonAudioFocus();
  }
}
