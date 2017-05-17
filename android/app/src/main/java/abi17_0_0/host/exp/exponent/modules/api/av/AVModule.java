// Copyright 2015-present 650 Industries. All rights reserved.

package abi17_0_0.host.exp.exponent.modules.api.av;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Build;
import android.support.v4.content.ContextCompat;
import android.view.View;

import abi17_0_0.com.facebook.react.bridge.Arguments;
import abi17_0_0.com.facebook.react.bridge.Callback;
import abi17_0_0.com.facebook.react.bridge.LifecycleEventListener;
import abi17_0_0.com.facebook.react.bridge.Promise;
import abi17_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi17_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi17_0_0.com.facebook.react.bridge.ReactMethod;
import abi17_0_0.com.facebook.react.bridge.ReadableMap;
import abi17_0_0.com.facebook.react.bridge.WritableMap;
import abi17_0_0.com.facebook.react.common.SystemClock;
import abi17_0_0.com.facebook.react.uimanager.NativeViewHierarchyManager;
import abi17_0_0.com.facebook.react.uimanager.UIBlock;
import abi17_0_0.com.facebook.react.uimanager.UIManagerModule;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import host.exp.exponent.utils.ExpFileUtils;
import host.exp.exponent.utils.ScopedContext;
import abi17_0_0.host.exp.exponent.ReadableObjectUtils;
import abi17_0_0.host.exp.exponent.modules.api.av.video.VideoView;

public class AVModule extends ReactContextBaseJavaModule
    implements LifecycleEventListener, AudioManager.OnAudioFocusChangeListener {
  private static final String AUDIO_MODE_SHOULD_DUCK_KEY = "shouldDuckAndroid";
  private static final String AUDIO_MODE_INTERRUPTION_MODE_KEY = "interruptionModeAndroid";

  private enum AudioInterruptionMode {
    DO_NOT_MIX,
    DUCK_OTHERS,
  }

  final ScopedContext mScopedContext; // used by PlayerData
  private final ReactApplicationContext mReactApplicationContext;

  private boolean mEnabled = true;

  private final AudioManager mAudioManager;
  private final BroadcastReceiver mNoisyAudioStreamReceiver;
  private boolean mAcquiredAudioFocus = false;

  private boolean mAppIsPaused = false;

  private AudioInterruptionMode mAudioInterruptionMode = AudioInterruptionMode.DUCK_OTHERS;
  private boolean mShouldDuckAudio = true;
  boolean mIsDuckingAudio = false; // used by PlayerData

  private int mSoundMapKeyCount = 0;
  // There will never be many PlayerData objects in the map, so HashMap is most efficient.
  private final Map<Integer, PlayerData> mSoundMap = new HashMap<>();
  private final Set<AudioEventHandler> mVideoViewSet = new HashSet<>();

  private MediaRecorder mAudioRecorder = null;
  private String mAudioRecordingFilePath = null;
  private long mAudioRecorderUptimeOfLastStartResume = 0L;
  private long mAudioRecorderDurationAlreadyRecorded = 0L;
  private boolean mAudioRecorderIsRecording = false;
  private boolean mAudioRecorderIsPaused = false;


  @Override
  public String getName() {
    return "ExponentAV";
  }

  public AVModule(final ReactApplicationContext reactContext, final ScopedContext scopedContext) {
    super(reactContext);

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
    mReactApplicationContext.addLifecycleEventListener(this);
  }

  // LifecycleEventListener

  @Override
  public void onHostResume() {
    if (mAppIsPaused) {
      mAppIsPaused = false;
      for (final AudioEventHandler handler : getAllRegisteredAudioEventHandlers()) {
        handler.onResume();
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
    }
  }

  @Override
  public void onHostDestroy() {
    mReactApplicationContext.unregisterReceiver(mNoisyAudioStreamReceiver);
    for (final Integer key : mSoundMap.keySet()) {
      removeSoundForKey(key);
    }
    removeAudioRecorder();
    abandonAudioFocus();
  }

  // Global audio state control API

  public void registerVideoViewForAudioLifecycle(final AudioEventHandler videoView) {
    mVideoViewSet.add(videoView);
  }

  public void unregisterVideoViewForAudioLifecycle(final AudioEventHandler videoView) {
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

  boolean tryAcquireAudioFocus() {
    if (!mEnabled || mAppIsPaused) {
      return false;
    }

    if (mAcquiredAudioFocus) {
      return true;
    }

    final int audioFocusRequest = mAudioInterruptionMode == AudioInterruptionMode.DO_NOT_MIX
        ? AudioManager.AUDIOFOCUS_GAIN : AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK;

    int result = mAudioManager.requestAudioFocus(this, AudioManager.STREAM_MUSIC, audioFocusRequest);
    mAcquiredAudioFocus = result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
    return mAcquiredAudioFocus;
  }

  private void abandonAudioFocus() {
    for (final AudioEventHandler handler : getAllRegisteredAudioEventHandlers()) {
      handler.pauseImmediately();
    }
    mAcquiredAudioFocus = false;
    mAudioManager.abandonAudioFocus(this);
  }

  void abandonAudioFocusIfUnused() { // used by PlayerData
    for (final AudioEventHandler handler : getAllRegisteredAudioEventHandlers()) {
      if (handler.isUsingAudioFocus()) {
        return;
      }
    }
    abandonAudioFocus();
  }

  private void updateDuckStatusForAllPlayersPlaying() {
    for (final AudioEventHandler handler : getAllRegisteredAudioEventHandlers()) {
      handler.updateVolumeMuteAndDuck();
    }
  }

  @ReactMethod
  public void setAudioIsEnabled(final Boolean value, final Promise promise) {
    mEnabled = value;
    if (!value) {
      abandonAudioFocus();
    }
    promise.resolve(null);
  }

  @ReactMethod
  public void setAudioMode(final ReadableMap map, final Promise promise) {
    mShouldDuckAudio = map.getBoolean(AUDIO_MODE_SHOULD_DUCK_KEY);
    if (!mShouldDuckAudio) {
      mIsDuckingAudio = false;
      updateDuckStatusForAllPlayersPlaying();
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

  @ReactMethod
  public void loadForSound(final String uriString, final ReadableMap status, final Callback loadSuccess, final Callback loadError) {
    final int key = mSoundMapKeyCount++;
    final PlayerData data = new PlayerData(this, Uri.parse(uriString), status, new PlayerData.PlayerDataLoadCompletionListener() {
      @Override
      public void onLoadSuccess(final WritableMap status) {
        loadSuccess.invoke(key, status);
      }

      @Override
      public void onLoadError(final String error) {
        mSoundMap.remove(key);
        loadError.invoke();
      }
    });
    data.setErrorListener(new PlayerData.PlayerDataErrorListener() {
      @Override
      public void onError(final String error) {
        removeSoundForKey(key);
      }
    });
    mSoundMap.put(key, data);
  }

  @ReactMethod
  public void unloadForSound(final Integer key, final Promise promise) {
    if (tryGetSoundForKey(key, promise) != null) {
      removeSoundForKey(key);
      promise.resolve(PlayerData.getUnloadedStatus());
    } // Otherwise, tryGetSoundForKey has already rejected the promise.
  }

  @ReactMethod
  public void setStatusForSound(final Integer key, final ReadableMap status, final Promise promise) {
    final PlayerData data = tryGetSoundForKey(key, promise);
    if (data != null) {
      data.setStatus(status, promise);
    } // Otherwise, tryGetSoundForKey has already rejected the promise.
  }

  @ReactMethod
  public void getStatusForSound(final Integer key, final Promise promise) {
    final PlayerData data = tryGetSoundForKey(key, promise);
    if (data != null) {
      promise.resolve(data.getStatus());
    } // Otherwise, tryGetSoundForKey has already rejected the promise.
  }

  @ReactMethod
  public void setStatusUpdateCallbackForSound(final Integer key, final Callback callback) {
    final PlayerData data = tryGetSoundForKey(key, null);
    if (data != null) {
      data.setStatusUpdateListener(new PlayerData.PlayerDataStatusUpdateListener() {
        @Override
        public void onStatusUpdate(final WritableMap status) {
          data.setStatusUpdateListener(null); // Can only use callback once.
          callback.invoke(status);
        }
      });
    }
  }

  @ReactMethod
  public void setErrorCallbackForSound(final Integer key, final Callback callback) {
    final PlayerData data = tryGetSoundForKey(key, null);
    if (data != null) {
      data.setErrorListener(new PlayerData.PlayerDataErrorListener() {
        @Override
        public void onError(final String error) {
          data.setErrorListener(null); // Can only use callback once.
          removeSoundForKey(key);
          callback.invoke(error);
        }
      });
    }
  }

  // Unified playback API - Video

  private interface VideoViewCallback {
    void runWithVideoView(final VideoView videoView);
  }

  // Rejects the promise if the VideoView is not found, otherwise executes the callback.
  private void tryRunWithVideoView(final Integer tag, final VideoViewCallback callback, final Promise promise) {
    mReactApplicationContext.getNativeModule(UIManagerModule.class).addUIBlock(new UIBlock() {
      @Override
      public void execute(final NativeViewHierarchyManager nativeViewHierarchyManager) {
        final VideoView videoView;
        try {
          final View view = nativeViewHierarchyManager.resolveView(tag);
          if (!(view instanceof VideoView)) {
            throw new Exception();
          }
          videoView = (VideoView) view;
        } catch (final Throwable e) {
          promise.reject("E_VIDEO_TAGINCORRECT", "Invalid view returned from registry.");
          return;
        }
        callback.runWithVideoView(videoView);
      }
    });
  }

  @ReactMethod
  public void loadForVideo(final Integer tag, final String uriString, final ReadableMap status, final Promise promise) {
    tryRunWithVideoView(tag, new VideoViewCallback() {
      @Override
      public void runWithVideoView(final VideoView videoView) {
        videoView.setUri(Uri.parse(uriString), status, promise);
      }
    }, promise); // Otherwise, tryRunWithVideoView has already rejected the promise.
  }

  @ReactMethod
  public void unloadForVideo(final Integer tag, final Promise promise) {
    tryRunWithVideoView(tag, new VideoViewCallback() {
      @Override
      public void runWithVideoView(final VideoView videoView) {
        videoView.setUri(null, null, promise);
      }
    }, promise); // Otherwise, tryRunWithVideoView has already rejected the promise.
  }

  @ReactMethod
  public void setStatusForVideo(final Integer tag, final ReadableMap status, final Promise promise) {
    tryRunWithVideoView(tag, new VideoViewCallback() {
      @Override
      public void runWithVideoView(final VideoView videoView) {
        videoView.setStatus(status, promise);
      }
    }, promise); // Otherwise, tryRunWithVideoView has already rejected the promise.
  }

  @ReactMethod
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
    return Build.VERSION.SDK_INT >= 23 &&
        ContextCompat.checkSelfPermission(getReactApplicationContext(), Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED;
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

  private WritableMap getAudioRecorderStatus() {
    final WritableMap map = Arguments.createMap();
    map.putBoolean("isRecording", mAudioRecorderIsRecording);
    map.putInt("durationMillis", (int) getAudioRecorderDurationMillis());
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

  @ReactMethod
  public void prepareAudioRecorder(final Promise promise) {
    if (isMissingAudioRecordingPermissions()) {
      promise.reject("E_MISSING_PERMISSION", "Missing audio recording permissions.");
      return;
    }

    removeAudioRecorder();

    final String filename = "recording-" + UUID.randomUUID().toString() + ".3gp";
    final WritableMap pathOptions = Arguments.createMap();
    pathOptions.putBoolean("cache", true);
    try {
      final File directory = new File(mScopedContext.toScopedPath("Audio", ReadableObjectUtils.readableToJson(pathOptions)));
      ExpFileUtils.ensureDirExists(directory);
      mAudioRecordingFilePath = directory + File.separator + filename;
    } catch (final IOException e) {
      // This only occurs in the case that the scoped path is not in this experience's scope,
      // which is never true.
    }

    mAudioRecorder = new MediaRecorder();
    mAudioRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
    mAudioRecorder.setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP);
    mAudioRecorder.setOutputFile(mAudioRecordingFilePath);
    mAudioRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB);

    try {
      mAudioRecorder.prepare();
    } catch (final Exception e) {
      promise.reject("E_AUDIO_RECORDERNOTCREATED", "Prepare encountered an error: recorder not prepared", e);
      removeAudioRecorder();
      return;
    }

    final WritableMap map = Arguments.createMap();
    map.putString("uri", ExpFileUtils.uriFromFile(new File(mAudioRecordingFilePath)).toString());
    map.putMap("status", getAudioRecorderStatus());
    promise.resolve(map);
  }

  @ReactMethod
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

  @ReactMethod
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

  @ReactMethod
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

  @ReactMethod
  public void getAudioRecordingStatus(final Promise promise) {
    if (checkAudioRecorderExistsOrReject(promise)) {
      promise.resolve(getAudioRecorderStatus());
    }
  }

  @ReactMethod
  public void unloadAudioRecorder(final Promise promise) {
    if (checkAudioRecorderExistsOrReject(promise)) {
      removeAudioRecorder();
      promise.resolve(null);
    }
  }
}
