// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.api;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static android.media.AudioManager.AUDIOFOCUS_LOSS_TRANSIENT;
import static android.media.AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK;

public class AudioModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
  private static final float INITIAL_VOLUME = 1f;
  // There will never be many MediaPlayer objects in the map, so HashMap is most efficient:
  private final Map<Integer, MediaPlayer> mPlayerPool = new HashMap<>();
  // TODO put player/volume/muted all into a more general struct analog in one dictionary:
  private final Map<Integer, Float> mVolumePool = new HashMap<>();
  private final Set<Integer> mMutedSet = new HashSet<>();
  private final Set<Integer> mPausedOnPauseSet = new HashSet<>();
  private final Set<Integer> mPausedOnAudioFocusLossSet = new HashSet<>();
  private final ReactApplicationContext mContext;
  private final AudioManager mAudioManager;
  private final AudioManager.OnAudioFocusChangeListener mAFChangeListener;
  private final BroadcastReceiver mNoisyAudioStreamReceiver;
  private boolean mEnabled = false;
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
        } else if (focusChange == AUDIOFOCUS_LOSS_TRANSIENT) {
          pauseAll(mPausedOnAudioFocusLossSet);
        } else if (focusChange == AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
          pauseAll(mPausedOnAudioFocusLossSet); // TODO: Duck volume.
        } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
          resumeAllThatWerePaused(mPausedOnAudioFocusLossSet);
        }
      }
    };

    reactContext.registerReceiver(mNoisyAudioStreamReceiver,
        new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY));
    reactContext.addLifecycleEventListener(this);
  }

  // Rejects the promise and returns null if the MediaPlayer is not found.
  private MediaPlayer tryGetMediaPlayerForKey(final Integer key, final Promise promise) {
    final MediaPlayer player = this.mPlayerPool.get(key);
    if (player == null && promise != null) {
      promise.reject("E_AUDIO_NOPLAYER", "Player does not exist.");
    }
    return player;
  }

  private WritableMap getStatusForKey(final Integer key) {
    final MediaPlayer player = this.mPlayerPool.get(key);
    final WritableMap map = Arguments.createMap();
    if (player != null) {
      map.putInt("position_millis", player.getCurrentPosition());
      map.putBoolean("is_playing", player.isPlaying());
      map.putBoolean("is_muted", mMutedSet.contains(key));
      map.putBoolean("is_looping", player.isLooping());
    }
    return map;
  }

  private int getNumPlayersPlaying() {
    // mPlayerPool will never be very big, so this is OK (rather than maintaining a member variable count)
    int count = 0;
    for (final MediaPlayer player : mPlayerPool.values()) {
      if (player.isPlaying()) {
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
    for (final Map.Entry<Integer, MediaPlayer> keyPlayerPair : mPlayerPool.entrySet()) {
      final MediaPlayer player = keyPlayerPair.getValue();
      if (pausedSet != null && player.isPlaying()) {
        pausedSet.add(keyPlayerPair.getKey());
      }
      if (player.isPlaying()) {
        player.pause();
      }
    }
    abandonAudioFocus();
  }

  private void resumeAllThatWerePaused(final Set<Integer> pausedSet) {
    if (!mEnabled) {
      return;
    }
    for (final Integer key : pausedSet) {
      if (tryAcquireAudioFocus()) {
        final MediaPlayer player = this.mPlayerPool.get(key);
        if (player != null) {
          player.start();
        }
      }
    }
    pausedSet.clear();
  }

  private boolean checkDisabledAndReject(final Promise promise) {
    if (!mEnabled) {
      promise.reject("E_AUDIO_DISABLED", "Exponent Audio not enabled.");
    }
    return !mEnabled;
  }

  private void unload(final Integer key) {
    final MediaPlayer player = this.mPlayerPool.get(key);
    if (player != null) {
      player.stop();
      player.release();
    }
    this.mPlayerPool.remove(key);
    this.mVolumePool.remove(key);
    this.mMutedSet.remove(key);
    this.mPausedOnPauseSet.remove(key);
    this.mPausedOnAudioFocusLossSet.remove(key);
  }

  @ReactMethod
  public void setIsEnabled(final Boolean value, final Promise promise) {
    if (value == mEnabled) {
      // There is no change in state.
    } else if (value) {
      mEnabled = true;
    } else {
      pauseAll(null);
      mEnabled = false;
    }
    promise.resolve(null);
  }

  @ReactMethod
  public void load(final String uriString, final Promise promise) {
    if (checkDisabledAndReject(promise)) {
      return;
    }

    final Uri uri = Uri.parse(uriString);
    final MediaPlayer player = MediaPlayer.create(this.mContext, uri);
    if (player == null) {
      promise.reject("E_AUDIO_PLAYERNOTCREATED", "Load encountered an error: player not created.");
      return;
    }
    final int key = mKeyCount++;
    mPlayerPool.put(key, player);
    mVolumePool.put(key, INITIAL_VOLUME);

    player.setOnPreparedListener(new MediaPlayer.OnPreparedListener() {
      public void onPrepared(MediaPlayer mp) {
        mp.setVolume(INITIAL_VOLUME, INITIAL_VOLUME);

        final WritableMap map = Arguments.createMap();
        map.putInt("key", key);
        map.putInt("duration_millis", mp.getDuration());
        map.putMap("status", getStatusForKey(key));
        promise.resolve(map);
      }
    });
  }

  @ReactMethod
  public void play(final Integer key, final Promise promise) {
    if (checkDisabledAndReject(promise)) {
      return;
    }

    final MediaPlayer player = tryGetMediaPlayerForKey(key, promise);
    if (player == null) {
      return; // tryGetMediaPlayerForKey has already rejected the promise.
    }

    if (tryAcquireAudioFocus() && !mPaused && !player.isPlaying()) {
      player.start();
    }

    final WritableMap map = Arguments.createMap();
    map.putMap("status", getStatusForKey(key));
    promise.resolve(map);
  }

  @ReactMethod
  public void pause(final Integer key, final Promise promise) {
    if (checkDisabledAndReject(promise)) {
      return;
    }

    final MediaPlayer player = tryGetMediaPlayerForKey(key, promise);
    if (player == null) {
      return; // tryGetMediaPlayerForKey has already rejected the promise.
    }

    if (player.isPlaying()) {
      player.pause();
    }
    abandonAudioFocusIfNoPlayersPlaying();

    final WritableMap map = Arguments.createMap();
    map.putMap("status", getStatusForKey(key));
    promise.resolve(map);
  }

  @ReactMethod
  public void stop(final Integer key, final Promise promise) {
    if (checkDisabledAndReject(promise)) {
      return;
    }

    final MediaPlayer player = tryGetMediaPlayerForKey(key, promise);
    if (player == null) {
      return; // tryGetMediaPlayerForKey has already rejected the promise.
    }

    player.seekTo(0);
    if (player.isPlaying()) {
      player.pause();
    }
    abandonAudioFocusIfNoPlayersPlaying();

    final WritableMap map = Arguments.createMap();
    map.putMap("status", getStatusForKey(key));
    promise.resolve(map);
  }

  @ReactMethod
  public void unload(final Integer key, final Promise promise) {
    if (checkDisabledAndReject(promise)) {
      return;
    }

    if (tryGetMediaPlayerForKey(key, promise) == null) {
      return; // tryGetMediaPlayerForKey has already rejected the promise.
    }

    unload(key);
    abandonAudioFocusIfNoPlayersPlaying();

    promise.resolve(null);
  }

  @ReactMethod
  public void setPosition(final Integer key, final Integer millis, final Promise promise) {
    if (checkDisabledAndReject(promise)) {
      return;
    }

    final MediaPlayer player = tryGetMediaPlayerForKey(key, promise);
    if (player == null) {
      return; // tryGetMediaPlayerForKey has already rejected the promise.
    }

    player.seekTo(millis);

    final WritableMap map = Arguments.createMap();
    map.putMap("status", getStatusForKey(key));
    promise.resolve(map);
  }

  @ReactMethod
  public void setVolume(final Integer key, final Double value, final Promise promise) {
    if (checkDisabledAndReject(promise)) {
      return;
    }

    if (value < 0.0 || value > 1.0) {
      promise.reject("E_AUDIO_INCORRECTPARAMETERS", "Volume value must be between 0.0 and 1.0.");
      return;
    }

    final MediaPlayer player = tryGetMediaPlayerForKey(key, promise);
    if (player == null) {
      return; // tryGetMediaPlayerForKey has already rejected the promise.
    }

    final float floatValue = value.floatValue();
    player.setVolume(floatValue, floatValue);
    this.mVolumePool.put(key, floatValue);

    final WritableMap map = Arguments.createMap();
    map.putMap("status", getStatusForKey(key));
    promise.resolve(map);
  }

  @ReactMethod
  public void setIsMuted(final Integer key, final Boolean value, final Promise promise) {
    if (checkDisabledAndReject(promise)) {
      return;
    }

    final MediaPlayer player = tryGetMediaPlayerForKey(key, promise);
    if (player == null) {
      return; // tryGetMediaPlayerForKey has already rejected the promise.
    }

    // TODO : potentially only do this once per toggle:
    if (value) {
      player.setVolume(0f, 0f);
      mMutedSet.add(key);
    } else {
      final float volume = this.mVolumePool.get(key);
      player.setVolume(volume, volume);
      mMutedSet.remove(key);
    }

    final WritableMap map = Arguments.createMap();
    map.putMap("status", getStatusForKey(key));
    promise.resolve(map);
  }

  @ReactMethod
  public void setIsLooping(final Integer key, final Boolean value, final Promise promise) {
    if (checkDisabledAndReject(promise)) {
      return;
    }

    final MediaPlayer player = tryGetMediaPlayerForKey(key, promise);
    if (player == null) {
      return; // tryGetMediaPlayerForKey has already rejected the promise.
    }

    player.setLooping(value);

    final WritableMap map = Arguments.createMap();
    map.putMap("status", getStatusForKey(key));
    promise.resolve(map);
  }

  @ReactMethod
  public void getStatus(final Integer key, final Promise promise) {
    if (checkDisabledAndReject(promise)) {
      return;
    }

    if (tryGetMediaPlayerForKey(key, promise) == null) {
      return; // tryGetMediaPlayerForKey has already rejected the promise.
    }

    final WritableMap map = Arguments.createMap();
    map.putMap("status", getStatusForKey(key));
    promise.resolve(map);
  }

  @ReactMethod
  public void setPlaybackFinishedCallback(final Integer key, final Callback callback) {
    if (!mEnabled) {
      return;
    }

    final MediaPlayer player = tryGetMediaPlayerForKey(key, null);
    if (player == null) {
      return; // tryGetMediaPlayerForKey has already rejected the promise.
    }

    player.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
      @Override
      public void onCompletion(final MediaPlayer mediaPlayer) {
        if (!mediaPlayer.isLooping()) {
          mediaPlayer.setOnCompletionListener(null); // Callback can only be invoked once.
          callback.invoke(true);
        }
      }
    });
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
    for (final Integer key : mPlayerPool.keySet()) {
      unload(key);
    }
    abandonAudioFocus();
  }
}
