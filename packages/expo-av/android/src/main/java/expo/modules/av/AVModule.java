// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.av;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioManager;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;

import com.google.android.exoplayer2.upstream.Loader;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import expo.core.ExportedModule;
import expo.core.Promise;
import expo.core.interfaces.Arguments;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.LifecycleEventListener;
import expo.modules.av.player.PlayerData;
import expo.modules.av.video.VideoView;

import static android.media.MediaRecorder.MEDIA_RECORDER_INFO_MAX_FILESIZE_REACHED;

public class AVModule extends ExportedModule
    implements LifecycleEventListener, AudioManager.OnAudioFocusChangeListener, MediaRecorder.OnInfoListener {
  private static final String AUDIO_MODE_SHOULD_DUCK_KEY = "shouldDuckAndroid";
  private static final String AUDIO_MODE_INTERRUPTION_MODE_KEY = "interruptionModeAndroid";

  private static final String RECORDING_OPTIONS_KEY = "android";
  private static final String RECORDING_OPTION_EXTENSION_KEY = "extension";
  private static final String RECORDING_OPTION_OUTPUT_FORMAT_KEY = "outputFormat";
  private static final String RECORDING_OPTION_AUDIO_ENCODER_KEY = "audioEncoder";
  private static final String RECORDING_OPTION_SAMPLE_RATE_KEY = "sampleRate";
  private static final String RECORDING_OPTION_NUMBER_OF_CHANNELS_KEY = "numberOfChannels";
  private static final String RECORDING_OPTION_BIT_RATE_KEY = "bitRate";
  private static final String RECORDING_OPTION_MAX_FILE_SIZE_KEY = "maxFileSize";
  private static final String AUDIO_MODE_PLAY_THROUGH_EARPIECE = "playThroughEarpieceAndroid";

  private boolean mShouldRouteThroughEarpiece = false;

  private enum AudioInterruptionMode {
    DO_NOT_MIX,
    DUCK_OTHERS,
  }

  public class AudioFocusNotAcquiredException extends Exception {
    AudioFocusNotAcquiredException(final String message) {
      super(message);
    }
  }

  public final Context mScopedContext; // used by PlayerData
  private final Context mReactApplicationContext;

  private boolean mEnabled = true;

  private final AudioManager mAudioManager;
  private final BroadcastReceiver mNoisyAudioStreamReceiver;
  private boolean mAcquiredAudioFocus = false;

  private boolean mAppIsPaused = false;

  private AudioInterruptionMode mAudioInterruptionMode = AudioInterruptionMode.DUCK_OTHERS;
  private boolean mShouldDuckAudio = true;
  private boolean mIsDuckingAudio = false;

  private int mSoundMapKeyCount = 0;
  // There will never be many PlayerData objects in the map, so HashMap is most efficient.
  private final Map<Integer, PlayerData> mSoundMap = new HashMap<>();
  private final Set<VideoView> mVideoViewSet = new HashSet<>();

  private MediaRecorder mAudioRecorder = null;
  private String mAudioRecordingFilePath = null;
  private long mAudioRecorderUptimeOfLastStartResume = 0L;
  private long mAudioRecorderDurationAlreadyRecorded = 0L;
  private boolean mAudioRecorderIsRecording = false;
  private boolean mAudioRecorderIsPaused = false;
  private Loader.Callback mAudioRecorderUnloadedCallback = null;


  @Override
  public String getName() {
    return "ExponentAV";
  }

  public AVModule(final Context reactContext, final Context scopedContext, String experienceId) {
    super(reactContext);
//    super(reactContext, experienceId);

    mScopedContext = scopedContext;
    mReactApplicationContext = reactContext;

    mAudioManager = (AudioManager) mScopedContext.getSystemService(Context.AUDIO_SERVICE);
    // Implemented because of the suggestion here:
    // https://developer.android.com/guide/topics/media-apps/volume-and-earphones.html
    mNoisyAudioStreamReceiver = new BroadcastReceiver() {
      @Override
      public void onReceive(Context context, Intent intent) {
        if (AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction())) {
          abandonAudioFocus();
        }
      }
    };
    mReactApplicationContext.registerReceiver(mNoisyAudioStreamReceiver,
        new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY));
    // TODO: ModuleRegistry
    //    mReactApplicationContext.addLifecycleEventListener(this);
  }

  private void sendEvent(String eventName, Bundle params) {
//    mReactApplicationContext
//        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
//        .emit(eventName, params);
  }

  // LifecycleEventListener

  @Override
  public void onHostResume() {
    if (mAppIsPaused) {
      mAppIsPaused = false;
      for (final AudioEventHandler handler : getAllRegisteredAudioEventHandlers()) {
        handler.onResume();
      }
      if (mShouldRouteThroughEarpiece) {
        updatePlaySoundThroughEarpiece(true);
      }
    }
  }

  @Override
  public void onHostPause() {
    if (!mAppIsPaused) {
      mAppIsPaused = true;
      for (final AudioEventHandler handler : getAllRegisteredAudioEventHandlers()) {
        handler.onPause();
      }
      abandonAudioFocus();

      if (mShouldRouteThroughEarpiece) {
        updatePlaySoundThroughEarpiece(false);
      }
    }
  }

  @Override
  public void onHostDestroy() {
    mReactApplicationContext.unregisterReceiver(mNoisyAudioStreamReceiver);
    for (final Integer key : mSoundMap.keySet()) {
      removeSoundForKey(key);
    }
    for (final VideoView videoView : mVideoViewSet) {
      videoView.unloadPlayerAndMediaController();
    }

    removeAudioRecorder();
    abandonAudioFocus();
  }

  // Global audio state control API

  public void registerVideoViewForAudioLifecycle(final VideoView videoView) {
    mVideoViewSet.add(videoView);
  }

  public void unregisterVideoViewForAudioLifecycle(final VideoView videoView) {
    mVideoViewSet.remove(videoView);
  }

  private Set<AudioEventHandler> getAllRegisteredAudioEventHandlers() {
    final Set<AudioEventHandler> set = new HashSet<>();
    set.addAll(mVideoViewSet);
    set.addAll(mSoundMap.values());
    return set;
  }

  @Override // AudioManager.OnAudioFocusChangeListener
  public void onAudioFocusChange(int focusChange) {
    switch (focusChange) {
      case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK:
        if (mShouldDuckAudio) {
          mIsDuckingAudio = true;
          mAcquiredAudioFocus = true;
          updateDuckStatusForAllPlayersPlaying();
          break;
        } // Otherwise, it is treated as AUDIOFOCUS_LOSS_TRANSIENT:
      case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
      case AudioManager.AUDIOFOCUS_LOSS:
        mIsDuckingAudio = false;
        mAcquiredAudioFocus = false;
        for (final AudioEventHandler handler : getAllRegisteredAudioEventHandlers()) {
          handler.handleAudioFocusInterruptionBegan();
        }
        break;
      case AudioManager.AUDIOFOCUS_GAIN:
        mIsDuckingAudio = false;
        mAcquiredAudioFocus = true;
        for (final AudioEventHandler handler : getAllRegisteredAudioEventHandlers()) {
          handler.handleAudioFocusGained();
        }
        break;
    }
  }

  public void acquireAudioFocus() throws AudioFocusNotAcquiredException {
    if (!mEnabled) {
      throw new AudioFocusNotAcquiredException("Expo Audio is disabled, so audio focus could not be acquired.");
    }

    if (mAppIsPaused) {
      throw new AudioFocusNotAcquiredException("This experience is currently in the background, so audio focus could not be acquired.");
    }

    if (mAcquiredAudioFocus) {
      return;
    }

    final int audioFocusRequest = mAudioInterruptionMode == AudioInterruptionMode.DO_NOT_MIX
        ? AudioManager.AUDIOFOCUS_GAIN : AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK;

    int result = mAudioManager.requestAudioFocus(this, AudioManager.STREAM_MUSIC, audioFocusRequest);
    mAcquiredAudioFocus = result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    if (!mAcquiredAudioFocus) {
      throw new AudioFocusNotAcquiredException("Audio focus could not be acquired from the OS at this time.");
    }
  }

  private void abandonAudioFocus() {
    for (final AudioEventHandler handler : getAllRegisteredAudioEventHandlers()) {
      if (handler.requiresAudioFocus()) {
        handler.pauseImmediately();
      }
    }
    mAcquiredAudioFocus = false;
    mAudioManager.abandonAudioFocus(this);
  }

  public void abandonAudioFocusIfUnused() { // used by PlayerData
    for (final AudioEventHandler handler : getAllRegisteredAudioEventHandlers()) {
      if (handler.requiresAudioFocus()) {
        return;
      }
    }
    abandonAudioFocus();
  }

  public float getVolumeForDuckAndFocus(final boolean isMuted, final float volume) {
    return (!mAcquiredAudioFocus || isMuted) ? 0f : mIsDuckingAudio ? volume / 2f : volume;
  }

  private void updateDuckStatusForAllPlayersPlaying() {
    for (final AudioEventHandler handler : getAllRegisteredAudioEventHandlers()) {
      handler.updateVolumeMuteAndDuck();
    }
  }

  private void updatePlaySoundThroughEarpiece(boolean playThroughEarpiece) {
    mAudioManager.setMode(playThroughEarpiece ? AudioManager.MODE_IN_COMMUNICATION : AudioManager.MODE_NORMAL);
    mAudioManager.setSpeakerphoneOn(!playThroughEarpiece);
  }

  @ExpoMethod
  public void setAudioIsEnabled(final Boolean value, final Promise promise) {
    mEnabled = value;
    if (!value) {
      abandonAudioFocus();
    }
    promise.resolve(null);
  }

  @ExpoMethod
  public void setAudioMode(final Arguments map, final Promise promise) {
    mShouldDuckAudio = map.getBoolean(AUDIO_MODE_SHOULD_DUCK_KEY);
    if (!mShouldDuckAudio) {
      mIsDuckingAudio = false;
      updateDuckStatusForAllPlayersPlaying();
    }

    if (map.containsKey(AUDIO_MODE_PLAY_THROUGH_EARPIECE)) {
      mShouldRouteThroughEarpiece = map.getBoolean(AUDIO_MODE_PLAY_THROUGH_EARPIECE);
      updatePlaySoundThroughEarpiece(mShouldRouteThroughEarpiece);
    }

    final int interruptionModeInt = map.getInt(AUDIO_MODE_INTERRUPTION_MODE_KEY);
    switch (interruptionModeInt) {
      case 1:
        mAudioInterruptionMode = AudioInterruptionMode.DO_NOT_MIX;
      case 2:
      default:
        mAudioInterruptionMode = AudioInterruptionMode.DUCK_OTHERS;
    }
    promise.resolve(null);
  }

  // Unified playback API - Audio

  // Rejects the promise and returns null if the PlayerData is not found.
  private PlayerData tryGetSoundForKey(final Integer key, final Promise promise) {
    final PlayerData data = this.mSoundMap.get(key);
    if (data == null && promise != null) {
      promise.reject("E_AUDIO_NOPLAYER", "Player does not exist.");
    }
    return data;
  }

  private void removeSoundForKey(final Integer key) {
    final PlayerData data = mSoundMap.remove(key);
    if (data != null) {
      data.release();
      abandonAudioFocusIfUnused();
    }
  }

  @ExpoMethod
  public void loadForSound(final Arguments source, final Arguments status, final Promise promise) {
    final int key = mSoundMapKeyCount++;
    final PlayerData data = PlayerData.createUnloadedPlayerData(this, mReactApplicationContext, source, status);
    data.setErrorListener(new PlayerData.ErrorListener() {
      @Override
      public void onError(final String error) {
        removeSoundForKey(key);
      }
    });
    mSoundMap.put(key, data);
    data.load(status, new PlayerData.LoadCompletionListener() {
      @Override
      public void onLoadSuccess(final Bundle status) {
        promise.resolve(Arrays.asList(key, status));
      }

      @Override
      public void onLoadError(final String error) {
        mSoundMap.remove(key);
        promise.reject("E_LOAD_ERROR", error, null);
      }
    });

    data.setStatusUpdateListener(new PlayerData.StatusUpdateListener() {
      @Override
      public void onStatusUpdate(final Bundle status) {
        Bundle payload = new Bundle();
        payload.putInt("key", key);
        payload.putBundle("status", status);
        sendEvent("didUpdatePlaybackStatus", payload);
      }
    });
  }

  @ExpoMethod
  public void unloadForSound(final Integer key, final Promise promise) {
    if (tryGetSoundForKey(key, promise) != null) {
      removeSoundForKey(key);
      promise.resolve(PlayerData.getUnloadedStatus());
    } // Otherwise, tryGetSoundForKey has already rejected the promise.
  }

  @ExpoMethod
  public void setStatusForSound(final Integer key, final Arguments status, final Promise promise) {
    final PlayerData data = tryGetSoundForKey(key, promise);
    if (data != null) {
      data.setStatus(status, promise);
    } // Otherwise, tryGetSoundForKey has already rejected the promise.
  }

  @ExpoMethod
  public void replaySound(final Integer key, final Arguments status, final Promise promise) {
    final PlayerData data = tryGetSoundForKey(key, promise);
    if (data != null) {
      data.setStatus(status, promise);
    } // Otherwise, tryGetSoundForKey has already rejected the promise.
  }

  @ExpoMethod
  public void getStatusForSound(final Integer key, final Promise promise) {
    final PlayerData data = tryGetSoundForKey(key, promise);
    if (data != null) {
      promise.resolve(data.getStatus());
    } // Otherwise, tryGetSoundForKey has already rejected the promise.
  }

  // Unified playback API - Video

  private interface VideoViewCallback {
    void runWithVideoView(final VideoView videoView);
  }

  // Rejects the promise if the VideoView is not found, otherwise executes the callback.
  private void tryRunWithVideoView(final Integer tag, final VideoViewCallback callback, final Promise promise) {
    // TODO: Use UIManager
//    mReactApplicationContext.getNativeModule(UIManagerModule.class).addUIBlock(new UIBlock() {
//      @Override
//      public void execute(final NativeViewHierarchyManager nativeViewHierarchyManager) {
//        final VideoViewWrapper videoViewWrapper;
//        try {
//          final View view = nativeViewHierarchyManager.resolveView(tag);
//          if (!(view instanceof VideoViewWrapper)) {
//            throw new Exception();
//          }
//          videoViewWrapper = (VideoViewWrapper) view;
//        } catch (final Throwable e) {
//          promise.reject("E_VIDEO_TAGINCORRECT", "Invalid view returned from registry.");
//          return;
//        }
//        callback.runWithVideoView(videoViewWrapper.getVideoViewInstance());
//      }
//    });
  }

  @ExpoMethod
  public void loadForVideo(final Integer tag, final Arguments source, final Arguments status, final Promise promise) {
    tryRunWithVideoView(tag, new VideoViewCallback() {
      @Override
      public void runWithVideoView(final VideoView videoView) {
        videoView.setSource(source, status, promise);
      }
    }, promise); // Otherwise, tryRunWithVideoView has already rejected the promise.
  }

  @ExpoMethod
  public void unloadForVideo(final Integer tag, final Promise promise) {
    tryRunWithVideoView(tag, new VideoViewCallback() {
      @Override
      public void runWithVideoView(final VideoView videoView) {
        videoView.setSource(null, null, promise);
      }
    }, promise); // Otherwise, tryRunWithVideoView has already rejected the promise.
  }

  @ExpoMethod
  public void setStatusForVideo(final Integer tag, final Arguments status, final Promise promise) {
    tryRunWithVideoView(tag, new VideoViewCallback() {
      @Override
      public void runWithVideoView(final VideoView videoView) {
        videoView.setStatus(status, promise);
      }
    }, promise); // Otherwise, tryRunWithVideoView has already rejected the promise.
  }

  @ExpoMethod
  public void replayVideo(final Integer tag, final Arguments status, final Promise promise) {
    tryRunWithVideoView(tag, new VideoViewCallback() {
      @Override
      public void runWithVideoView(final VideoView videoView) {
        videoView.setStatus(status, promise);
      }
    }, promise); // Otherwise, tryRunWithVideoView has already rejected the promise.
  }

  @ExpoMethod
  public void getStatusForVideo(final Integer tag, final Promise promise) {
    tryRunWithVideoView(tag, new VideoViewCallback() {
      @Override
      public void runWithVideoView(final VideoView videoView) {
        promise.resolve(videoView.getStatus());
      }
    }, promise); // Otherwise, tryRunWithVideoView has already rejected the promise.
  }

  // Note that setStatusUpdateCallback happens in the JS for video via onStatusUpdate

  // Recording API

  private boolean isMissingAudioRecordingPermissions() {
    // TODO: Use Permissions module
//    return !Exponent.getInstance().getPermissions(Manifest.permission.RECORD_AUDIO, this.experienceId);
  }

  // Rejects the promise and returns false if the MediaRecorder is not found.
  private boolean checkAudioRecorderExistsOrReject(final Promise promise) {
    if (mAudioRecorder == null && promise != null) {
      promise.reject("E_AUDIO_NORECORDER", "Recorder does not exist.");
    }
    return mAudioRecorder != null;
  }

  private long getAudioRecorderDurationMillis() {
    if (mAudioRecorder == null) {
      return 0L;
    }
    long duration = mAudioRecorderDurationAlreadyRecorded;
    if (mAudioRecorderIsRecording && mAudioRecorderUptimeOfLastStartResume > 0) {
      duration += SystemClock.uptimeMillis() - mAudioRecorderUptimeOfLastStartResume;
    }
    return duration;
  }

  private Bundle getAudioRecorderStatus() {
    final Bundle map = new Bundle();
    if (mAudioRecorder != null) {
      map.putBoolean("canRecord", true);
      map.putBoolean("isRecording", mAudioRecorderIsRecording);
      map.putInt("durationMillis", (int) getAudioRecorderDurationMillis());
    }
    return map;
  }

  private void removeAudioRecorder() {
    if (mAudioRecorder != null) {
      try {
        mAudioRecorder.stop();
      } catch (final RuntimeException e) {
        // Do nothing-- this just means that the recorder is already stopped,
        // or was stopped immediately after starting.
      }
      mAudioRecorder.release();
      mAudioRecorder = null;
    }

    mAudioRecordingFilePath = null;
    mAudioRecorderIsRecording = false;
    mAudioRecorderIsPaused = false;
    mAudioRecorderDurationAlreadyRecorded = 0L;
    mAudioRecorderUptimeOfLastStartResume = 0L;
  }

  @Override
  public void onInfo(final MediaRecorder mr, final int what, final int extra) {
    switch (what) {
      case MEDIA_RECORDER_INFO_MAX_FILESIZE_REACHED:
        final Bundle finalStatus = new Bundle();
        removeAudioRecorder();
        if (mAudioRecorderUnloadedCallback != null) {
          final Loader.Callback callback = mAudioRecorderUnloadedCallback;
          mAudioRecorderUnloadedCallback = null;
          callback.invoke(finalStatus);
        }
      default:
        // Do nothing
    }
  }

  @ExpoMethod
  public void setUnloadedCallbackForAndroidRecording(final Loader.Callback callback) {
    // In JS, this is called before prepareAudioRecorder to make sure it is
    // available immediately upon recording. So, we don't check mAudioRecorder != null.
    mAudioRecorderUnloadedCallback = callback;
  }

  @ExpoMethod
  public void prepareAudioRecorder(final Arguments options, final Promise promise) {
    if (isMissingAudioRecordingPermissions()) {
      promise.reject("E_MISSING_PERMISSION", "Missing audio recording permissions.");
      return;
    }

    removeAudioRecorder();

    final Arguments androidOptions = options.getArguments(RECORDING_OPTIONS_KEY);

    final String filename = "recording-" + UUID.randomUUID().toString()
        + androidOptions.getString(RECORDING_OPTION_EXTENSION_KEY);
    try {
      final File directory = new File(mScopedContext.getCacheDir() + File.separator + "Audio");
      ensureDirExists(directory);
      mAudioRecordingFilePath = directory + File.separator + filename;
    } catch (final IOException e) {
      // This only occurs in the case that the scoped path is not in this experience's scope,
      // which is never true.
    }

    mAudioRecorder = new MediaRecorder();
    mAudioRecorder.setAudioSource(MediaRecorder.AudioSource.DEFAULT);

    mAudioRecorder.setOutputFormat(androidOptions.getInt(RECORDING_OPTION_OUTPUT_FORMAT_KEY));
    mAudioRecorder.setAudioEncoder(androidOptions.getInt(RECORDING_OPTION_AUDIO_ENCODER_KEY));
    if (androidOptions.containsKey(RECORDING_OPTION_SAMPLE_RATE_KEY)) {
      mAudioRecorder.setAudioSamplingRate(androidOptions.getInt(RECORDING_OPTION_SAMPLE_RATE_KEY));
    }
    if (androidOptions.containsKey(RECORDING_OPTION_NUMBER_OF_CHANNELS_KEY)) {
      mAudioRecorder.setAudioChannels(androidOptions.getInt(RECORDING_OPTION_NUMBER_OF_CHANNELS_KEY));
    }
    if (androidOptions.containsKey(RECORDING_OPTION_BIT_RATE_KEY)) {
      mAudioRecorder.setAudioEncodingBitRate(androidOptions.getInt(RECORDING_OPTION_BIT_RATE_KEY));
    }

    mAudioRecorder.setOutputFile(mAudioRecordingFilePath);

    if (androidOptions.containsKey(RECORDING_OPTION_MAX_FILE_SIZE_KEY)) {
      mAudioRecorder.setMaxFileSize(androidOptions.getInt(RECORDING_OPTION_MAX_FILE_SIZE_KEY));
      mAudioRecorder.setOnInfoListener(this);
    }

    try {
      mAudioRecorder.prepare();
    } catch (final Exception e) {
      promise.reject("E_AUDIO_RECORDERNOTCREATED", "Prepare encountered an error: recorder not prepared", e);
      removeAudioRecorder();
      return;
    }

    final Bundle map = new Bundle();
    map.putString("uri", Uri.fromFile(new File(mAudioRecordingFilePath)).toString());
    map.putBundle("status", getAudioRecorderStatus());
    promise.resolve(map);
  }

  @ExpoMethod
  public void startAudioRecording(final Promise promise) {
    if (isMissingAudioRecordingPermissions()) {
      promise.reject("E_MISSING_PERMISSION", "Missing audio recording permissions.");
      return;
    }

    if (checkAudioRecorderExistsOrReject(promise)) {
      try {
        if (mAudioRecorderIsPaused && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
          mAudioRecorder.resume();
        } else {
          mAudioRecorder.start();
        }
      } catch (final IllegalStateException e) {
        promise.reject("E_AUDIO_RECORDING", "Start encountered an error: recording not started", e);
        return;
      }

      mAudioRecorderUptimeOfLastStartResume = SystemClock.uptimeMillis();
      mAudioRecorderIsRecording = true;
      mAudioRecorderIsPaused = false;

      promise.resolve(getAudioRecorderStatus());
    }
  }

  @ExpoMethod
  public void pauseAudioRecording(final Promise promise) {
    if (checkAudioRecorderExistsOrReject(promise)) {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
        promise.reject("E_AUDIO_VERSIONINCOMPATIBLE", "Pausing an audio recording is unsupported on" +
            " Android devices running SDK < 24.");
      } else {
        try {
          mAudioRecorder.pause();
        } catch (final IllegalStateException e) {
          promise.reject("E_AUDIO_RECORDINGPAUSE", "Pause encountered an error: recording not paused", e);
          return;
        }

        mAudioRecorderDurationAlreadyRecorded = getAudioRecorderDurationMillis();
        mAudioRecorderIsRecording = false;
        mAudioRecorderIsPaused = true;

        promise.resolve(getAudioRecorderStatus());
      }
    }
  }

  @ExpoMethod
  public void stopAudioRecording(final Promise promise) {
    if (checkAudioRecorderExistsOrReject(promise)) {
      try {
        mAudioRecorder.stop();
      } catch (final RuntimeException e) {
        promise.reject("E_AUDIO_RECORDINGSTOP", "Stop encountered an error: recording not stopped", e);
        return;
      }

      mAudioRecorderDurationAlreadyRecorded = getAudioRecorderDurationMillis();
      mAudioRecorderIsRecording = false;
      mAudioRecorderIsPaused = false;

      promise.resolve(getAudioRecorderStatus());
    }
  }

  @ExpoMethod
  public void getAudioRecordingStatus(final Promise promise) {
    if (checkAudioRecorderExistsOrReject(promise)) {
      promise.resolve(getAudioRecorderStatus());
    }
  }

  @ExpoMethod
  public void unloadAudioRecorder(final Promise promise) {
    if (checkAudioRecorderExistsOrReject(promise)) {
      removeAudioRecorder();
      promise.resolve(null);
    }
  }

  private static File ensureDirExists(File dir) throws IOException {
    if (!(dir.isDirectory() || dir.mkdirs())) {
      throw new IOException("Couldn't create directory '" + dir + "'");
    }
    return dir;
  }
}
