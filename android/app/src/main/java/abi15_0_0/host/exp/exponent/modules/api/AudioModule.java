// Copyright 2015-present 650 Industries. All rights reserved.

package abi15_0_0.host.exp.exponent.modules.api;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.PlaybackParams;
import android.net.Uri;
import android.os.Build;
import android.support.annotation.RequiresApi;

import abi15_0_0.com.facebook.react.bridge.Arguments;
import abi15_0_0.com.facebook.react.bridge.Callback;
import abi15_0_0.com.facebook.react.bridge.LifecycleEventListener;
import abi15_0_0.com.facebook.react.bridge.Promise;
import abi15_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi15_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi15_0_0.com.facebook.react.bridge.ReactMethod;
import abi15_0_0.com.facebook.react.bridge.WritableMap;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static android.media.AudioManager.AUDIOFOCUS_LOSS_TRANSIENT;
import static android.media.AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK;

public class AudioModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
  private static final float INITIAL_VOLUME = 1f;
  private static final float INITIAL_RATE = 1f;

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

  // There will never be many PlayerData objects in the map, so HashMap is most efficient:
  private final Map<Integer, PlayerData> mPlayerDataPool = new HashMap<>();
  private final Set<Integer> mPausedOnPauseSet = new HashSet<>();
  private final Set<Integer> mPausedOnAudioFocusLossSet = new HashSet<>();
  private final ReactApplicationContext mContext;
  private final AudioManager mAudioManager;
  private final AudioManager.OnAudioFocusChangeListener mAFChangeListener;
  private final BroadcastReceiver mNoisyAudioStreamReceiver;
  private boolean mPaused = false;
  private boolean mAcquiredAudioFocus = false;
  private int mKeyCount = 0;

  @Override
  public String getName() {
    return "ExponentAudio";
  }

  public AudioModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.mContext = reactContext;
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
          pauseAll(null); // Permanent loss of focus
          mAcquiredAudioFocus = false;
        } else if (focusChange == AUDIOFOCUS_LOSS_TRANSIENT) {
          pauseAll(mPausedOnAudioFocusLossSet);
          mAcquiredAudioFocus = false;
        } else if (focusChange == AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
          pauseAll(mPausedOnAudioFocusLossSet); // TODO: Duck volume.
          mAcquiredAudioFocus = false;
        } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
          mAcquiredAudioFocus = true;
          resumeAllThatWerePaused(mPausedOnAudioFocusLossSet);
        }
      }
    };

    reactContext.registerReceiver(mNoisyAudioStreamReceiver,
        new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY));
    reactContext.addLifecycleEventListener(this);
  }

  // Rejects the promise and returns null if the PlayerData is not found.
  private PlayerData tryGetDataForKey(final Integer key, final Promise promise) {
    final PlayerData data = this.mPlayerDataPool.get(key);
    if (data == null && promise != null) {
      promise.reject("E_AUDIO_NOPLAYER", "Player does not exist.");
    }
    return data;
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
    int result = mAudioManager.requestAudioFocus(mAFChangeListener,
        AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
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

  private void unload(final Integer key) {
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

  @ReactMethod
  public void setIsEnabled(final Boolean value, final Promise promise) {
    if (!value) {
      pauseAll(null);
      this.mPausedOnPauseSet.clear();
      this.mPausedOnAudioFocusLossSet.clear();
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
        mp.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
          @Override
          public void onCompletion(final MediaPlayer mediaPlayer) {
            if (!mediaPlayer.isLooping()) {
              if (data.mFinishCallback != null) {
                data.mFinishCallback.invoke(data.getStatus());
                data.mFinishCallback = null; // Callback can only be invoked once.
              }
              abandonAudioFocusIfNoPlayersPlaying();
            }
          }
        });

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

    unload(key);
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
    if (value < 0.0 || value > 32.0) { // TODO: MOVE TO JS
      promise.reject("E_AUDIO_INCORRECTPARAMETERS", "Rate value must be between 0.0 and 32.0.");
      return;
    }

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
    if (value < 0.0 || value > 1.0) { // TODO: MOVE TO JS
      promise.reject("E_AUDIO_INCORRECTPARAMETERS", "Volume value must be between 0.0 and 1.0.");
      return;
    }

    final PlayerData data = tryGetDataForKey(key, promise);
    if (data == null) {
      return; // tryGetDataForKey has already rejected the promise.
    }

    final float floatValue = value.floatValue();
    data.mMediaPlayer.setVolume(floatValue, floatValue);
    data.mVolume = floatValue;

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

    final float newVolume = value ? 0f : data.mVolume;
    data.mMediaPlayer.setVolume(newVolume, newVolume);
    data.mMuted = value;

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
      unload(key);
    }
    abandonAudioFocus();
  }
}
